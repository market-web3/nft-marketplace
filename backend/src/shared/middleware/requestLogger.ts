/**
 * Request Logger Middleware
 * Logs all incoming requests
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, getRequestLogger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate request ID
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = requestId;

  // Get user ID if authenticated
  const userId = (req as any).user?.id;

  // Create request-specific logger
  const requestLogger = getRequestLogger(requestId, userId);
  (req as any).logger = requestLogger;

  // Log request start
  const startTime = Date.now();

  requestLogger.debug({
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  }, 'Request started');

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length'),
    };

    if (res.statusCode >= 500) {
      requestLogger.error(logData, 'Request failed');
    } else if (res.statusCode >= 400) {
      requestLogger.warn(logData, 'Request warning');
    } else {
      requestLogger.info(logData, 'Request completed');
    }
  });

  next();
};
