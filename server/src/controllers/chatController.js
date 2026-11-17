/**
 * @file chatController.js
 * @description Controller handling chat conversation lifecycle, message history, and AI querying.
 * @inputs req.user (authenticated user), req.params, req.body with legal question.
 * @outputs JSON payloads containing chats, messages, and structured assistant responses.
 */

import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { aiService, AIServiceError } from '../services/aiService.js';
import { generateLegalAdvice } from '../services/llm.js';
import { config } from '../config/env.js';

/**
 * Get all chats for the logged in user
 * GET /api/chats
 */
export async function getChats(req, res, next) {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      chats
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new chat session
 * POST /api/chats
 */
export async function createChat(req, res, next) {
  try {
    const { title } = req.body;
    const chat = await Chat.create({
      userId: req.user._id,
      title: title ? title.trim().slice(0, 150) : 'New Legal Query'
    });

    res.status(201).json({
      success: true,
      chat
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Rename a chat title
 * PATCH /api/chats/:id
 */
export async function renameChat(req, res, next) {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required to rename chat.'
      });
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { title: title.trim().slice(0, 150), updatedAt: new Date() },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied.'
      });
    }

    res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a chat and all associated messages
 * DELETE /api/chats/:id
 */
export async function deleteChat(req, res, next) {
  try {
    const { id } = req.params;

    const chat = await Chat.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied.'
      });
    }

    // Delete all messages belonging to this chat
    await Message.deleteMany({ chatId: id });

    res.status(200).json({
      success: true,
      message: 'Chat and all messages deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all messages for a specific chat
 * GET /api/chats/:id/messages
 */
export async function getMessages(req, res, next) {
  try {
    const { id } = req.params;

    // Verify ownership
    const chat = await Chat.findOne({ _id: id, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied.'
      });
    }

    const messages = await Message.find({ chatId: id })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      chat,
      messages
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Ask a legal question inside a chat
 * POST /api/chats/:id/ask
 * Body: { question: string, retryMessageId?: string }
 */
export async function askQuestion(req, res, next) {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    const { question, retryMessageId } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A legal question is required.'
      });
    }

    const trimmedQuestion = question.trim();

    // Enforce 1000 characters limit
    if (trimmedQuestion.length > 1000) {
      return res.status(400).json({
        success: false,
        message: `Question length (${trimmedQuestion.length} characters) exceeds the maximum limit of 1000 characters.`
      });
    }

    // 1. Authenticate user and verify chat ownership
    const chat = await Chat.findOne({ _id: id, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found or unauthorized.'
      });
    }

    // 2. Manage user message: reuse existing message on retry or create new
    let userMessage;
    let isRetry = false;

    if (retryMessageId) {
      userMessage = await Message.findOne({ _id: retryMessageId, chatId: id, role: 'user' });
      if (userMessage) {
        isRetry = true;
      }
    }

    if (!userMessage) {
      userMessage = await Message.create({
        chatId: id,
        role: 'user',
        content: trimmedQuestion
      });
    }

    // 3. Retrieve recent conversation history from MongoDB (excluding current user message)
    const previousMessages = await Message.find({
      chatId: id,
      _id: { $ne: userMessage._id }
    })
      .sort({ createdAt: 1 })
      .lean();

    const conversationHistory = previousMessages.map((msg) => ({
      role: msg.role,
      content: msg.role === 'assistant'
        ? (msg.structuredResponse?.answer?.summary || msg.answer?.plain_explanation || msg.content)
        : msg.content
    }));

    let ragResponse;
    let modelName = 'NVIDIA Nemotron RAG';

    try {
      if (config.mockLlm) {
        // Mock fallback for unit tests and offline development
        const mockResult = await generateLegalAdvice({
          question: trimmedQuestion,
          history: previousMessages
        });

        const mockAnswer = mockResult.answer || {};
        ragResponse = {
          query: {
            original_query: trimmedQuestion,
            refined_query: trimmedQuestion,
            plain_language_query: trimmedQuestion
          },
          problem_summary: {
            title: mockAnswer.problem_summary || 'Legal Grievance',
            category: mockAnswer.category || 'General Legal',
            description: mockAnswer.plain_explanation || trimmedQuestion
          },
          answer: {
            summary: mockAnswer.plain_explanation || 'Legal assessment provided.',
            explanation: (mockAnswer.next_steps || []).map(s => `${s.title}: ${s.detail}`)
          },
          citations: (mockAnswer.legal_match || []).map((m, idx) => ({
            citation_id: `citation_${idx + 1}`,
            act: m.name,
            section: m.reference,
            title: m.name,
            supporting_text: m.why_it_applies,
            source_id: 'mock_doc',
            file_name: 'Indian_Statutes.pdf',
            page_number: 1
          })),
          retrieval: {
            total_chunks_retrieved: 0,
            chunks: []
          },
          next_steps: {
            actions: (mockAnswer.next_steps || []).map((s, idx) => ({
              step: idx + 1,
              title: s.title,
              description: s.detail,
              source_ids: [],
              source_pages: [],
              source_type: 'RAG_AND_LLM'
            }))
          },
          warnings: (mockAnswer.warnings || []).map(w => ({
            type: 'LEGAL_CAUTION',
            message: w
          })),
          limitations: [],
          metadata: {
            status: 'ANSWERED',
            model: mockResult.model || 'Nemotron Mock',
            retrieval_method: 'Mock RAG',
            top_k: 5
          }
        };
        modelName = mockResult.model || 'Nemotron Mock';
      } else {
        // Call external FastAPI RAG microservice
        ragResponse = await aiService.sendLegalChat({
          question: trimmedQuestion,
          top_k: 5,
          document_id: null,
          conversationHistory
        });
        modelName = ragResponse.metadata?.model || 'nvidia/nemotron';
      }
    } catch (aiError) {
      // If AI fails and this was a newly created user message, roll it back to prevent duplicate messages upon retry
      if (!isRetry && userMessage) {
        await Message.findByIdAndDelete(userMessage._id).catch(() => {});
      }

      const statusCode = aiError.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: aiError.message || 'Legal AI microservice failed to process request.',
        canRetry: true,
        question: trimmedQuestion
      });
    }

    const latencyMs = Date.now() - startTime;
    const isFallback = Boolean(ragResponse.metadata?.is_fallback || ragResponse.metadata?.status === 'FALLBACK');

    // 4. Save complete structured assistant response in MongoDB
    const assistantMessage = await Message.create({
      chatId: id,
      role: 'assistant',
      content: ragResponse.answer?.summary || ragResponse.problem_summary?.description || trimmedQuestion,
      structuredResponse: ragResponse,
      status: ragResponse.metadata?.status || 'ANSWERED',
      answer: {
        ...ragResponse,
        // Preserve legacy fields for backward compatibility with existing tests and UI
        in_scope: !isFallback && ragResponse.metadata?.status !== 'OUT_OF_SCOPE',
        category: ragResponse.problem_summary?.category || 'Motor Vehicle Law',
        problem_summary: ragResponse.problem_summary?.title || ragResponse.problem_summary?.description,
        plain_explanation: ragResponse.answer?.summary,
        is_fallback: isFallback
      },
      model: modelName,
      latencyMs,
      error: null
    });

    // 5. Update Chat title if it's currently generic/new
    if (chat.title === 'New Legal Query' || previousMessages.length === 0) {
      const summary = ragResponse.problem_summary?.title || trimmedQuestion;
      const cleanTitle = summary
        .split(' ')
        .slice(0, 7)
        .join(' ')
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
        .trim();

      chat.title = cleanTitle || 'Legal Query';
    }

    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json({
      success: true,
      userMessage,
      assistantMessage,
      chat: {
        id: chat._id,
        title: chat.title,
        updatedAt: chat.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}
