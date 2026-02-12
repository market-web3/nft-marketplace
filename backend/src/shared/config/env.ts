/**
 * Environment Configuration
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Server Ports
  API_PORT: z.string().transform(Number).default('3000'),
  GATEWAY_PORT: z.string().transform(Number).default('3001'),
  METRICS_PORT: z.string().transform(Number).default('9090'),
  
  // Database
  DATABASE_URL: z.string(),
  DATABASE_POOL_SIZE: z.string().transform(Number).default('20'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_CLUSTER_ENABLED: z.string().transform(Boolean).default('false'),
  
  // RabbitMQ
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
  
  // TON Blockchain
  TON_API_ENDPOINT: z.string().default('https://toncenter.com/api/v2'),
  TON_API_KEY: z.string().optional(),
  TON_NETWORK: z.enum(['mainnet', 'testnet']).default('testnet'),
  TON_CONTRACT_ADDRESS: z.string().optional(),
  TON_DEPOSIT_WALLET: z.string().optional(),
  TON_WITHDRAW_WALLET: z.string().optional(),
  
  // Security
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // WebSocket
  WS_HEARTBEAT_INTERVAL: z.string().transform(Number).default('30000'),
  WS_MAX_CONNECTIONS: z.string().transform(Number).default('10000'),
  
  // Telegram Bot
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),
  
  // Marketplace Settings
  MARKETPLACE_FEE_PERCENT: z.string().transform(Number).default('250'), // 2.5%
  MIN_LISTING_PRICE: z.string().transform(Number).default('10000000'), // 0.01 TON
  MIN_WITHDRAW_AMOUNT: z.string().transform(Number).default('100000000'), // 0.1 TON
  
  // Highload Wallet
  HIGHLOAD_WALLET_TIMEOUT: z.string().transform(Number).default('600'),
  HIGHLOAD_MAX_BATCH_SIZE: z.string().transform(Number).default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
});

export type Config = z.infer<typeof envSchema>;

function loadConfig(): Config {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw error;
  }
}

export const config = loadConfig();

// Feature flags
export const features = {
  ENABLE_WEBSOCKET: true,
  ENABLE_TELEGRAM_BOT: !!config.TELEGRAM_BOT_TOKEN,
  ENABLE_METRICS: true,
  ENABLE_RATE_LIMITING: config.NODE_ENV === 'production',
  ENABLE_CACHE: true,
  ENABLE_BATCH_OPERATIONS: true,
};
