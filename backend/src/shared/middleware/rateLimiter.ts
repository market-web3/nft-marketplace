/**
 * Rate Limiting Middleware
 */

import rateLimit from 'express-rate-limit';
import { RedisManager } from '../utils/redis';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// Auth endpoints stricter limit
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
    }, 'Rate limit exceeded for auth endpoint');
    
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(15 * 60), // seconds
    });
  },
});

// General API limit
export const apiLimiter = rateLimit({
  windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS as unknown as string, 10) || 60000,
  max: parseInt(config.RATE_LIMIT_MAX_REQUESTS as unknown as string, 10) || 100,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return ((req as any).user?.id || req.ip) as string;
  },
});

// Strict limit for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests for this operation',
  },
});
