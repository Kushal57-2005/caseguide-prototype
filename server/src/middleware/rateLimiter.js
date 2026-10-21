/**
 * @file rateLimiter.js
 * @description Rate limiting middleware configurations for API endpoints to prevent abuse.
 * @inputs Request IP / user identifier.
 * @outputs Middleware functions enforcing sliding window rate limits.
 */

import rateLimit from 'express-rate-limit';

// Global API rate limiter (15 minutes, 300 requests)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Auth endpoints rate limiter (15 minutes, 30 requests)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.'
  }
});

// Chat ask endpoint rate limiter per user/IP (1 minute, 15 queries)
export const askLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // If authenticated, key by user ID, else by IP
    return req.user ? req.user._id.toString() : req.ip;
  },
  message: {
    success: false,
    message: 'Rate limit exceeded: You can submit up to 15 legal queries per minute. Please pause for a moment.'
  }
});
