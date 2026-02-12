/**
 * Logger Utility
 * Structured logging with Pino
 */

import pino from 'pino';
import { config } from '../config/env';

const loggerConfig: pino.LoggerOptions = {
  level: config.LOG_LEVEL,
  base: {
    service: 'nft-marketplace-backend',
    version: '2.0.0',
    environment: config.NODE_ENV,
  },
};

if (config.LOG_FORMAT === 'pretty' && config.NODE_ENV === 'development') {
  loggerConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(loggerConfig);

// Request context logger
export function getRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    userId,
  });
}

// Transaction context logger
export function getTransactionLogger(
  transactionId: string,
  type: string,
  hash?: string
) {
  return logger.child({
    transactionId,
    transactionType: type,
    transactionHash: hash,
  });
}

// Performance logger
export function logPerformance(
  operation: string,
  durationMs: number,
  metadata?: Record<string, any>
) {
  logger.info({
    operation,
    durationMs,
    ...metadata,
  }, `Performance: ${operation} took ${durationMs}ms`);
}

// Error logger with context
export function logError(
  error: Error,
  context: {
    operation: string;
    userId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
  }
) {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    operation: context.operation,
    userId: context.userId,
    requestId: context.requestId,
    ...context.metadata,
  }, `Error in ${context.operation}: ${error.message}`);
}
