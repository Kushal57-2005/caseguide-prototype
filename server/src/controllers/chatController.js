/**
 * @file chatController.js
 * @description Controller handling chat conversation lifecycle, message history, and AI querying.
 * @inputs req.user (authenticated user), req.params, req.body with legal question.
 * @outputs JSON payloads containing chats, messages, and structured assistant responses.
 */

import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { generateLegalAdvice } from '../services/llm.js';

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
      { title: title.trim().slice(0, 150) },
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
 * Body: { question: string }
 */
export async function askQuestion(req, res, next) {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    const { question } = req.body;

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

    // Verify chat exists and belongs to user
    const chat = await Chat.findOne({ _id: id, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found or unauthorized.'
      });
    }

    // Retrieve prior message history for context
    const previousMessages = await Message.find({ chatId: id })
      .sort({ createdAt: 1 })
      .lean();

    // 1. Save user question message
    const userMessage = await Message.create({
      chatId: id,
      role: 'user',
      content: trimmedQuestion
    });

    let llmResult;
    try {
      // 2. Call LLM service
      llmResult = await generateLegalAdvice({
        question: trimmedQuestion,
        history: previousMessages
      });
    } catch (llmError) {
      // Record failed assistant message if wanted, or return clear error
      const latencyMs = Date.now() - startTime;
      await Message.create({
        chatId: id,
        role: 'assistant',
        content: llmError.message || 'Error communicating with legal model.',
        model: 'Nemotron',
        latencyMs,
        error: llmError.message
      });

      return res.status(llmError.statusCode || 500).json({
        success: false,
        message: llmError.message || 'Failed to generate legal response.',
        canRetry: true
      });
    }

    // 3. Save structured assistant message
    const assistantMessage = await Message.create({
      chatId: id,
      role: 'assistant',
      content: llmResult.answer.plain_explanation || trimmedQuestion,
      answer: llmResult.answer,
      model: llmResult.model,
      latencyMs: llmResult.latencyMs,
      error: llmResult.error
    });

    // 4. Update Chat title if it's currently generic/new
    if (chat.title === 'New Legal Query' || previousMessages.length === 0) {
      const summary = llmResult.answer.problem_summary || trimmedQuestion;
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
