/**
 * @file healthRoutes.js
 * @description Health inspection route providing server, database, and LLM configuration status.
 * @inputs GET /api/health
 * @outputs JSON system health metrics.
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import { config } from '../config/env.js';

const router = Router();

router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusMap[dbStatus] || 'unknown',
      connected: dbStatus === 1
    },
    llm: {
      provider: 'NVIDIA NIM',
      model: config.nvidiaModel,
      baseUrl: config.nvidiaBaseUrl,
      thinkingEnabled: config.enableThinking,
      mockMode: config.mockLlm
    }
  });
});

export default router;
