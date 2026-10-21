/**
 * @file Chat.js
 * @description Mongoose Chat conversation model grouping legal Q&A messages per user.
 * @inputs userId, title.
 * @outputs Mongoose Chat model instance with automated timestamps.
 */

import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      default: 'New Legal Query',
      trim: true,
      maxlength: 150
    }
  },
  {
    timestamps: true
  }
);

// Indexes on userId and createdAt
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index({ createdAt: -1 });

export const Chat = mongoose.model('Chat', chatSchema);
