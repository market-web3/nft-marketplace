/**
 * Logger Utility for Telegram Bot
 */

import pino from 'pino';

const loggerConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'telegram-bot',
    version: '2.0.0',
  },
};

if (process.env.NODE_ENV !== 'production') {
  loggerConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(loggerConfig);
