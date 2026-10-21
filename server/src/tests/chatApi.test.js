/**
 * @file chatApi.test.js
 * @description Integration tests for chat routes: creating chats, asking legal questions,
 * verifying 1000-char limits, and receiving structured assistant messages.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { config } from '../config/env.js';
import { createApp } from '../app.js';

describe('Chat API & /ask Integration Tests', () => {
  let testUser;
  let authToken;
  let testChat;

  beforeAll(async () => {
    config.mockLlm = true;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodbUri);
    }

    testUser = await User.create({
      name: 'Advocate Rajesh',
      email: `test-chat-${Date.now()}@caseguide.local`,
      passwordHash: 'hashedpwd123'
    });

    authToken = jwt.sign(
      { id: testUser._id.toString(), email: testUser.email, name: testUser.name },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }
    if (testChat) {
      await Chat.findByIdAndDelete(testChat._id);
      await Message.deleteMany({ chatId: testChat._id });
    }
    await mongoose.connection.close();
  });

  it('should create a chat session and persist in MongoDB', async () => {
    testChat = await Chat.create({
      userId: testUser._id,
      title: 'New Legal Query'
    });

    expect(testChat._id).toBeDefined();
    expect(testChat.userId.toString()).toBe(testUser._id.toString());
  });

  it('should process legal query, save both messages, and return structured assistant response', async () => {
    // Import controller directly to test logic with express mock req/res
    const { askQuestion } = await import('../controllers/chatController.js');

    const req = {
      user: testUser,
      params: { id: testChat._id.toString() },
      body: { question: 'Online seller sent defective phone and refused refund.' }
    };

    let responseData = null;
    let statusCode = 200;

    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      }
    };

    await askQuestion(req, res, () => {});

    expect(statusCode).toBe(200);
    expect(responseData.success).toBe(true);
    expect(responseData.userMessage).toBeDefined();
    expect(responseData.assistantMessage).toBeDefined();
    expect(responseData.assistantMessage.answer.in_scope).toBe(true);
    expect(responseData.assistantMessage.answer.category).toBe('consumer');

    // Verify messages saved in DB
    const savedMessages = await Message.find({ chatId: testChat._id });
    expect(savedMessages.length).toBe(2);
  });

  it('should reject questions exceeding 1000 characters with 400 Bad Request', async () => {
    const { askQuestion } = await import('../controllers/chatController.js');

    const longQuestion = 'A'.repeat(1005);
    const req = {
      user: testUser,
      params: { id: testChat._id.toString() },
      body: { question: longQuestion }
    };

    let statusCode = 200;
    let responseData = null;

    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      }
    };

    await askQuestion(req, res, () => {});

    expect(statusCode).toBe(400);
    expect(responseData.success).toBe(false);
    expect(responseData.message).toContain('exceeds the maximum limit of 1000 characters');
  });
});
