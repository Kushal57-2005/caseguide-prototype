/**
 * @file env.js
 * @description Centralized configuration loader for caseGuide server environment variables.
 * @inputs Reads process.env initialized via dotenv.
 * @outputs Validated configuration object with fallback defaults for server and AI client.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/caseguide',
  jwtSecret: process.env.JWT_SECRET || 'caseguide_dev_secret_key_change_in_production_982347',
  
  // NVIDIA NIM Configuration
  nvidiaApiKey: process.env.NVIDIA_API_KEY || '',
  nvidiaBaseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  nvidiaModel: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b',
  enableThinking: process.env.ENABLE_THINKING === 'true',
  
  // Mock mode for local testing without active NVIDIA key
  mockLlm: process.env.MOCK_LLM === 'true' || !process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === 'your_nvidia_api_key_here'
};
