/**
 * @file healthRoutes.js
 * @description Health inspection route providing server, database, and LLM configuration status.
 * @inputs GET /api/health
 * @outputs JSON system health metrics.
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { aiService } from '../services/aiService.js';

const router = Router();

router.get('/', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const aiHealth = await aiService.checkHealth();

  res.status(200).json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusMap[dbStatus] || 'unknown',
      connected: dbStatus === 1
    },
    aiMicroservice: {
      url: config.aiServiceUrl,
      connected: aiHealth.connected,
      status: aiHealth.status,
      error: aiHealth.error || null
    },
    llm: {
      provider: 'NVIDIA Nemotron RAG Microservice',
      serviceUrl: config.aiServiceUrl,
      mockMode: config.mockLlm
    }
  });
});

export default router;
