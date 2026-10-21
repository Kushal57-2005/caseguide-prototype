/**
 * @file errorHandler.js
 * @description Centralized Express error handler to guarantee friendly JSON error responses and server stability.
 * @inputs Error object, req, res, next.
 * @outputs Standardized JSON error response without exposing internal server crash traces.
 */

import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[caseGuide-Error]', {
    message: err.message,
    name: err.name,
    stack: config.nodeEnv === 'development' ? err.stack : undefined
  });

  // Handle Mongoose Duplicate Key Error (e.g. Email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `An account with this ${field} already exists.`
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. ')
    });
  }

  // Handle JWT Error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' && { details: err.stack })
  });
}
