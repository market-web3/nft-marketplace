/**
 * Request Logging Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, getRequestLogger } from '../utils/logger';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = requestId;

  const startTime = Date.now();
  const userId = (req as any).user?.id;
  const requestLogger = getRequestLogger(requestId, userId);

  // Log request
  requestLogger.debug({
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  }, 'Incoming request');

  // Capture response
  const originalSend = res.send.bind(res);
  res.send = function(body: any) {
    const duration = Date.now() - startTime;
    
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length'),
    };

    if (res.statusCode >= 400) {
      requestLogger.warn(logData, `Request completed with status ${res.statusCode}`);
    } else {
      requestLogger.info(logData, 'Request completed successfully');
    }

    return originalSend(body);
  };

  next();
};
