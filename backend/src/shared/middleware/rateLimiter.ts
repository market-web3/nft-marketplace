/**
 * Rate Limiter Middleware
 * API rate limiting protection
 */

import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { RedisManager } from '../utils/redis';

// General API rate limiter
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => RedisManager.getInstance().call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

// Stricter rate limiter for auth endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => RedisManager.getInstance().call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Strict limiter for sensitive operations
export const strictLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => RedisManager.getInstance().call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    success: false,
    error: 'Rate limit exceeded for this operation.',
  },
});
