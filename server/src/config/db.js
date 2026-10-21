/**
 * @file db.js
 * @description MongoDB connection manager using Mongoose for caseGuide.
 * @inputs Reads config.mongodbUri.
 * @outputs Establishes Mongoose connection or logs informative error on failure.
 */

import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });
    console.log(`[caseGuide-DB] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[caseGuide-DB] Error connecting to MongoDB: ${error.message}`);
    // Do not crash during initial import if database starts slightly later
    throw error;
  }
}
