/**
 * @file app.js
 * @description Express application setup, security headers (helmet), CORS, JSON parser, and routes.
 * @inputs Inbound HTTP requests.
 * @outputs Express app ready to be bound to HTTP server or tested via supertest.
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

export function createApp() {
  const app = express();

  // Security HTTP headers
  app.use(helmet());

  // CORS configured strictly for client origin
  const allowedOrigins = [
    config.clientOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not permitted by CORS policy`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Global rate limiter
  app.use('/api', globalLimiter);

  // Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/chats', chatRoutes);

  // 404 handler for undefined routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Cannot ${req.method} ${req.originalUrl}`
    });
  });

  // Central error handling middleware
  app.use(errorHandler);

  return app;
}
