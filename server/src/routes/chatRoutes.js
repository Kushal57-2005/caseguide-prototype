/**
 * @file chatRoutes.js
 * @description API route definitions for chat sessions, message histories, and legal queries (/api/chats).
 * @inputs Express Router request dispatches.
 * @outputs Routes mapped to chatController handlers protected by requireAuth and askLimiter.
 */

import { Router } from 'express';
import {
  getChats,
  createChat,
  renameChat,
  deleteChat,
  getMessages,
  askQuestion
} from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';
import { askLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Protect all chat routes
router.use(requireAuth);

router.get('/', getChats);
router.post('/', createChat);
router.patch('/:id', renameChat);
router.delete('/:id', deleteChat);
router.get('/:id/messages', getMessages);

// Rate-limited legal question route
router.post('/:id/ask', askLimiter, askQuestion);

export default router;
