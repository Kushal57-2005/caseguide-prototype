/**
 * @file aiService.js
 * @description Dedicated Axios microservice client interfacing with the external FastAPI RAG backend.
 * Handles query forwarding, multi-turn conversation context, validation of StructuredRAGResponse,
 * timeouts, Render cold-start handling, and administrative document operations.
 */

import axios from 'axios';
import { config } from '../config/env.js';

export class AIServiceError extends Error {
  constructor(message, statusCode = 500, originalError = null, canRetry = true) {
    super(message);
    this.name = 'AIServiceError';
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.canRetry = canRetry;
  }
}

/**
 * Creates and configures the Axios instance for FastAPI microservice
 */
function createApiClient() {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  if (config.aiServiceApiKey) {
    headers['X-API-Key'] = config.aiServiceApiKey;
  }

  return axios.create({
    baseURL: config.aiServiceUrl.replace(/\/+$/, ''),
    timeout: config.aiServiceTimeoutMs || 60000,
    headers
  });
}

const apiClient = createApiClient();

/**
 * Validates that the response payload matches the required StructuredRAGResponse schema
 */
export function validateStructuredRAGResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new AIServiceError('Invalid response payload: expected an object.', 502);
  }

  if (!data.query || typeof data.query !== 'object') {
    throw new AIServiceError('Invalid response payload: missing "query" block.', 502);
  }

  if (!data.problem_summary || typeof data.problem_summary !== 'object') {
    throw new AIServiceError('Invalid response payload: missing "problem_summary" block.', 502);
  }

  if (!data.answer || typeof data.answer !== 'object') {
    throw new AIServiceError('Invalid response payload: missing "answer" block.', 502);
  }

  if (!Array.isArray(data.citations)) {
    data.citations = [];
  }

  if (!data.retrieval || typeof data.retrieval !== 'object') {
    data.retrieval = {
      total_chunks_retrieved: 0,
      chunks: []
    };
  }

  if (!data.next_steps || typeof data.next_steps !== 'object') {
    data.next_steps = { actions: [] };
  }

  if (!Array.isArray(data.warnings)) {
    data.warnings = [];
  }

  if (!Array.isArray(data.limitations)) {
    data.limitations = [];
  }

  if (!data.metadata || typeof data.metadata !== 'object') {
    data.metadata = {
      status: 'ANSWERED',
      model: 'nvidia/nemotron',
      retrieval_method: 'ChromaDB Dense Vector Search',
      top_k: 5
    };
  }

  return data;
}

/**
 * Standardizes Axios errors into informative AIServiceError instances
 */
function handleAxiosError(err, context = 'operation') {
  if (err instanceof AIServiceError) {
    return err;
  }

  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return new AIServiceError(
      'The AI service timed out while processing your request. The service may be waking up from a cold start. Please retry in a few seconds.',
      504,
      err,
      true
    );
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
    return new AIServiceError(
      'The AI service is currently unreachable. Please check network connectivity or try again shortly.',
      503,
      err,
      true
    );
  }

  if (err.response) {
    const status = err.response.status;
    const errorDetail = err.response.data?.detail || err.response.data?.message;

    if (status === 422) {
      return new AIServiceError(
        `AI service rejected the request payload (validation error): ${JSON.stringify(errorDetail || err.response.data)}`,
        422,
        err,
        false
      );
    }

    if (status === 429) {
      return new AIServiceError(
        'The AI service is receiving high traffic and is currently rate-limited. Please wait a moment and retry.',
        429,
        err,
        true
      );
    }

    if (status >= 500) {
      return new AIServiceError(
        `AI service returned an internal error (${status}): ${typeof errorDetail === 'string' ? errorDetail : 'Processing failed'}`,
        502,
        err,
        true
      );
    }

    return new AIServiceError(
      `AI service error (${status}): ${typeof errorDetail === 'string' ? errorDetail : err.message}`,
      status,
      err,
      true
    );
  }

  return new AIServiceError(
    `Failed to communicate with AI service during ${context}: ${err.message}`,
    500,
    err,
    true
  );
}

/**
 * AI Service Microservice Interface
 */
export const aiService = {
  /**
   * Primary RAG chat completion method
   * POST /api/chat/
   * @param {Object} params
   * @param {string} params.question - User's legal query
   * @param {number} [params.top_k=5] - Number of chunks to retrieve (1-20)
   * @param {string|null} [params.document_id=null] - Optional document filter
   * @param {Array<{role: string, content: string}>} [params.conversationHistory=[]] - Multi-turn context
   * @returns {Promise<Object>} Validated StructuredRAGResponse
   */
  async sendLegalChat({
    question,
    top_k = 5,
    document_id = null,
    conversationHistory = []
  }) {
    if (!question || typeof question !== 'string' || !question.trim()) {
      throw new AIServiceError('A non-empty question string is required.', 400, null, false);
    }

    // Prepare strictly compliant request payload
    const payload = {
      question: question.trim(),
      top_k: Math.max(1, Math.min(20, parseInt(top_k, 10) || 5)),
      document_id: document_id || null
    };

    // Attach conversation history only when non-empty
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      payload.conversation_history = conversationHistory
        .filter(msg => msg && msg.role && msg.content)
        .map(msg => ({
          role: String(msg.role).toLowerCase(),
          content: String(msg.content).trim()
        }));
    }

    try {
      const response = await apiClient.post('/api/chat/', payload);
      return validateStructuredRAGResponse(response.data);
    } catch (err) {
      throw handleAxiosError(err, 'legal query processing');
    }
  },

  /**
   * Health check on FastAPI backend
   * GET /health
   */
  async checkHealth() {
    try {
      const response = await apiClient.get('/health', { timeout: 8000 });
      return {
        connected: true,
        status: response.data?.status || 'healthy',
        url: config.aiServiceUrl
      };
    } catch (err) {
      return {
        connected: false,
        status: 'unreachable',
        error: err.message,
        url: config.aiServiceUrl
      };
    }
  },

  /**
   * List indexed documents from FastAPI
   * GET /api/documents/
   */
  async getDocuments() {
    try {
      const response = await apiClient.get('/api/documents/');
      return response.data;
    } catch (err) {
      throw handleAxiosError(err, 'fetching documents');
    }
  },

  /**
   * Delete an indexed document
   * DELETE /api/documents/{document_id}
   */
  async deleteDocument(documentId) {
    if (!documentId) {
      throw new AIServiceError('documentId is required.', 400);
    }
    try {
      const response = await apiClient.delete(`/api/documents/${encodeURIComponent(documentId)}`);
      return response.data;
    } catch (err) {
      throw handleAxiosError(err, 'deleting document');
    }
  },

  /**
   * Forward multipart/form-data PDF upload to FastAPI
   * POST /api/documents/upload
   */
  async uploadDocument(formData, headers = {}) {
    try {
      const response = await apiClient.post('/api/documents/upload', formData, {
        headers: {
          ...headers
        },
        timeout: 120000 // Ingestion might take up to 2 minutes
      });
      return response.data;
    } catch (err) {
      throw handleAxiosError(err, 'uploading document');
    }
  }
};
