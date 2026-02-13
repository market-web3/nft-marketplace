/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from './errorHandler';
import { RedisManager } from '../utils/redis';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
    role: 'user' | 'admin';
  };
}

interface TokenPayload {
  userId: string;
  walletAddress: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    const isBlacklisted = await RedisManager.exists(`blacklist:token:${token}`);
    if (isBlacklisted) {
      throw new AppError(401, 'Token has been revoked', 'TOKEN_REVOKED');
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    
    req.user = {
      id: decoded.userId,
      walletAddress: decoded.walletAddress,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token', 'INVALID_TOKEN'));
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Token expired', 'TOKEN_EXPIRED'));
      return;
    }
    next(error);
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin') {
    next(new AppError(403, 'Admin access required', 'FORBIDDEN'));
    return;
  }
  next();
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    
    req.user = {
      id: decoded.userId,
      walletAddress: decoded.walletAddress,
      role: decoded.role,
    };
  } catch (error) {
    // Ignore auth errors for optional auth
  }
  
  next();
};
