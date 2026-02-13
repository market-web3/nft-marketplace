/**
 * Global Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  
  if (err instanceof AppError) {
    logger.warn({
      requestId,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
      path: req.path,
      method: req.method,
    }, `AppError: ${err.message}`);

    res.status(err.statusCode).json({
      success: false,
      error: err.code || 'ERROR',
      message: err.message,
      details: err.details,
      requestId,
    });
    return;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: err.message,
      requestId,
    });
    return;
  }

  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
      requestId,
    });
    return;
  }

  // Log unexpected errors
  logger.error({
    requestId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    path: req.path,
    method: req.method,
  }, `Unexpected error: ${err.message}`);

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: isDev ? err.message : 'An unexpected error occurred',
    ...(isDev && { stack: err.stack }),
    requestId,
  });
};
