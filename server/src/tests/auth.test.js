/**
 * @file auth.test.js
 * @description Unit tests for auth controller logic and JWT signing/verification.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/env.js';

describe('Auth & User Model Unit Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodbUri);
    }
  });

  afterAll(async () => {
    // Clean up test users
    await User.deleteMany({ email: /test-phase1@caseguide\.local/ });
    await mongoose.connection.close();
  });

  it('should hash user password securely', async () => {
    const rawPassword = 'SecurePassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    expect(hash).not.toBe(rawPassword);
    const isMatch = await bcrypt.compare(rawPassword, hash);
    expect(isMatch).toBe(true);
  });

  it('should create and find a user document in MongoDB', async () => {
    const testEmail = `test-phase1-${Date.now()}@caseguide.local`;
    const passwordHash = await bcrypt.hash('password123', 10);

    const user = await User.create({
      name: 'Priya Sharma',
      email: testEmail,
      passwordHash
    });

    expect(user._id).toBeDefined();
    expect(user.name).toBe('Priya Sharma');
    expect(user.email).toBe(testEmail);

    const found = await User.findById(user._id);
    expect(found).not.toBeNull();
    expect(found.email).toBe(testEmail);
  });

  it('should sign and verify valid JWT token', () => {
    const payload = { id: 'mock-user-id-123', email: 'priya@example.com' };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, config.jwtSecret);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
  });
});
