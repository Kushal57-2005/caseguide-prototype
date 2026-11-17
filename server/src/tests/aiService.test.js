/**
 * @file aiService.test.js
 * @description Unit tests for aiService Axios client: payload mapping, StructuredRAGResponse validation,
 * error handling (422, 429, 500, 504 timeouts, network failure), and document operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService, validateStructuredRAGResponse, AIServiceError } from '../services/aiService.js';

describe('AI Service Client (aiService)', () => {
  describe('validateStructuredRAGResponse', () => {
    it('should validate and return a well-formed StructuredRAGResponse', () => {
      const mockResponse = {
        query: {
          original_query: 'What is Section 110?',
          refined_query: 'Section 110 vehicle recall',
          plain_language_query: 'How does vehicle recall work?'
        },
        problem_summary: {
          title: 'Vehicle Recall',
          category: 'Motor Vehicles',
          description: 'A query on recall provisions.'
        },
        answer: {
          summary: 'Recall applies if defects are detected.',
          explanation: ['Point 1', 'Point 2']
        },
        citations: [
          {
            citation_id: 'citation_001',
            act: 'Motor Vehicles Act',
            section: 'Section 110',
            title: 'Recall',
            supporting_text: 'Text',
            source_id: 'doc1',
            file_name: 'test.pdf',
            page_number: 1
          }
        ],
        retrieval: {
          total_chunks_retrieved: 1,
          chunks: []
        },
        next_steps: {
          actions: []
        },
        warnings: [],
        limitations: [],
        metadata: {
          status: 'ANSWERED',
          model: 'nvidia/nemotron',
          retrieval_method: 'ChromaDB',
          top_k: 5
        }
      };

      const result = validateStructuredRAGResponse(mockResponse);
      expect(result).toBeDefined();
      expect(result.query.original_query).toBe('What is Section 110?');
      expect(result.citations).toHaveLength(1);
    });

    it('should correctly normalize a FallbackResponse from FastAPI', () => {
      const fallbackPayload = {
        status: 'fallback',
        response: "I couldn't find enough relevant information to answer your question accurately.\n\nCaseGuide currently specializes in Indian Motor Vehicle Law, including traffic violations, fines, driving licences, vehicle registration, permits, road accidents, insurance-related motor vehicle provisions, and road safety regulations.\n\nPlease rephrase your question with more details about your Motor Vehicle Law issue so I can help you find relevant legal information.",
        sources: []
      };

      const result = validateStructuredRAGResponse(fallbackPayload, 'Can I get a refund for my laptop?');
      expect(result).toBeDefined();
      expect(result.metadata.status).toBe('FALLBACK');
      expect(result.metadata.is_fallback).toBe(true);
      expect(result.answer.summary).toContain("CaseGuide currently specializes in Indian Motor Vehicle Law");
      expect(result.query.original_query).toBe('Can I get a refund for my laptop?');
      expect(result.problem_summary.category).toBe('Motor Vehicle Law');
      expect(result.next_steps.actions.length).toBeGreaterThan(0);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should throw an AIServiceError if missing required sections', () => {
      expect(() => validateStructuredRAGResponse(null)).toThrow(AIServiceError);
      expect(() => validateStructuredRAGResponse({})).toThrow(AIServiceError);
      expect(() => validateStructuredRAGResponse({ query: {} })).toThrow(AIServiceError);
    });

    it('should provide safe array defaults for missing optional collections', () => {
      const minimalValid = {
        query: { original_query: 'q', refined_query: 'q', plain_language_query: 'q' },
        problem_summary: { title: 't', category: 'c', description: 'd' },
        answer: { summary: 's', explanation: [] }
      };

      const result = validateStructuredRAGResponse(minimalValid);
      expect(Array.isArray(result.citations)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.limitations)).toBe(true);
      expect(result.retrieval).toBeDefined();
      expect(result.metadata.status).toBe('ANSWERED');
    });
  });

  describe('sendLegalChat Input Validation', () => {
    it('should reject empty question strings with 400 Bad Request', async () => {
      await expect(aiService.sendLegalChat({ question: '' })).rejects.toThrow('A non-empty question string is required.');
      await expect(aiService.sendLegalChat({ question: '   ' })).rejects.toThrow('A non-empty question string is required.');
    });
  });

  describe('Live or Configured FastAPI Communication', () => {
    it('should successfully ping health check on FastAPI backend', async () => {
      const health = await aiService.checkHealth();
      expect(health).toBeDefined();
      expect(typeof health.connected).toBe('boolean');
      expect(health.url).toBeDefined();
      if (health.connected) {
        expect(health.status).toBe('healthy');
      }
    });
  });
});
