/**
 * Authentication Middleware
 * JWT token validation
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { APIError } from './errorHandler';
import { RedisManager } from '../utils/redis';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new APIError(401, 'Authentication required', 'AUTH_REQUIRED');
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const isBlacklisted = await RedisManager.getInstance().get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new APIError(401, 'Token has been revoked', 'TOKEN_REVOKED');
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof APIError) {
      next(error);
    } else {
      next(new APIError(401, 'Invalid token', 'INVALID_TOKEN'));
    }
  }
};

export const authenticateSocket = async (token: string): Promise<any> => {
  // Check if token is blacklisted
  const isBlacklisted = await RedisManager.getInstance().get(`blacklist:${token}`);
  if (isBlacklisted) {
    throw new Error('Token has been revoked');
  }

  // Verify token
  const decoded = jwt.verify(token, config.JWT_SECRET) as any;
  return decoded;
};

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    // Continue without user
    next();
  }
};

// Admin only middleware
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user?.isAdmin) {
    next(new APIError(403, 'Admin access required', 'ADMIN_REQUIRED'));
    return;
  }
  next();
};
