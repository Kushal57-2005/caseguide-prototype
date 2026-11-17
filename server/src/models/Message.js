/**
 * @file Message.js
 * @description Mongoose Message model storing individual user questions and structured assistant answers.
 * @inputs chatId, role, content, answer (structured JSON), model, latencyMs, error.
 * @outputs Mongoose Message model instance with query indexes.
 */

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    // The user's text prompt or assistant raw text fallback
    content: {
      type: String,
      required: true
    },
    // Complete structured response from FastAPI RAG service
    structuredResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // RAG processing status (e.g. ANSWERED, PARTIAL_ANSWER, INSUFFICIENT_EVIDENCE)
    status: {
      type: String,
      default: null
    },
    // Backward-compatible structured answer field
    answer: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    model: {
      type: String,
      default: null
    },
    latencyMs: {
      type: Number,
      default: 0
    },
    error: {
      type: String,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

// Compound indexes for rapid sequential message retrieval
messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
