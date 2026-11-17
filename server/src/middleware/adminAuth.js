/**
 * @file adminAuth.js
 * @description Authorization middleware protecting administrative document management endpoints.
 * Validates either user admin role (from JWT) or X-Admin-Key matching server configuration.
 */

import { config } from '../config/env.js';

export function requireAdmin(req, res, next) {
  // 1. Check API Key header
  const adminKey = req.headers['x-admin-key'];
  if (adminKey && config.adminApiKey && adminKey === config.adminApiKey) {
    return next();
  }

  // 2. Check authenticated user role
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Forbidden: Document administration requires administrative privileges.'
  });
}
