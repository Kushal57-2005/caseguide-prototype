/**
 * @file documentRoutes.js
 * @description Secure administrative document management routes interfacing with FastAPI RAG backend.
 * Provides document listing, PDF multipart uploading, and document deletion.
 */

import { Router } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { aiService } from '../services/aiService.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024 // 30 MB max PDF size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported for document ingestion.'), false);
    }
  }
});

/**
 * List all indexed legal documents in FastAPI ChromaDB
 * GET /api/documents
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const data = await aiService.getDocuments();
    res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Upload and ingest a legal PDF into FastAPI ChromaDB
 * POST /api/documents/upload
 * Requires Admin privileges
 */
router.post(
  '/upload',
  requireAuth,
  requireAdmin,
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'A PDF file is required in the "file" field.'
        });
      }

      // Build multipart/form-data payload for FastAPI
      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype || 'application/pdf'
      });

      const result = await aiService.uploadDocument(formData, formData.getHeaders());

      res.status(200).json({
        success: true,
        message: 'Document successfully uploaded and indexed in RAG store.',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Delete a document from FastAPI ChromaDB and storage
 * DELETE /api/documents/:document_id
 * Requires Admin privileges
 */
router.delete('/:document_id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { document_id } = req.params;
    const result = await aiService.deleteDocument(document_id);
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully from RAG store.',
      ...result
    });
  } catch (error) {
    next(error);
  }
});

export default router;
