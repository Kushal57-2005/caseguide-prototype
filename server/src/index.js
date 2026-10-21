/**
 * @file index.js
 * @description Server entry point: connects to MongoDB and starts listening on designated PORT.
 * @inputs Reads config settings from config/env.js.
 * @outputs Running Express HTTP server.
 */

import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

async function bootstrap() {
  try {
    // Connect to MongoDB
    await connectDB();

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(`⚖️  caseGuide AI Legal Assistant Backend Started`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`🤖 LLM Provider: NVIDIA NIM (${config.nvidiaModel})`);
      console.log(`🛠️  Mock Mode: ${config.mockLlm ? 'ENABLED (Offline Safe)' : 'DISABLED (Live NVIDIA API)'}`);
      console.log(`===============================================`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n[caseGuide-Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[caseGuide-Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[caseGuide-Server] Fatal bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();
