/**
 * Health Check Routes
 */

import { Router } from 'express';
import { DatabaseManager } from '../../shared/utils/database';
import { RedisManager } from '../../shared/utils/redis';
import { logger } from '../../shared/utils/logger';

const router = Router();

// Basic health check
router.get('/', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'nft-marketplace-backend',
    version: '2.0.0',
  });
});

// Detailed health check with dependencies
router.get('/detailed', async (req, res) => {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  const allHealthy = checks.every(c => c.healthy);

  const status = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'nft-marketplace-backend',
    version: '2.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: checks.reduce((acc, check) => {
      acc[check.name] = {
        status: check.healthy ? 'healthy' : 'unhealthy',
        responseTime: check.responseTime,
        ...(check.error && { error: check.error }),
      };
      return acc;
    }, {} as Record<string, any>),
  };

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(status);
});

// Readiness check
router.get('/ready', async (req, res) => {
  try {
    await Promise.all([
      DatabaseManager.healthCheck(),
      RedisManager.getInstance().ping(),
    ]);

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness check
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

async function checkDatabase() {
  const start = Date.now();
  try {
    await DatabaseManager.healthCheck();
    return {
      name: 'database',
      healthy: true,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'database',
      healthy: false,
      responseTime: Date.now() - start,
      error: (error as Error).message,
    };
  }
}

async function checkRedis() {
  const start = Date.now();
  try {
    await RedisManager.getInstance().ping();
    return {
      name: 'redis',
      healthy: true,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'redis',
      healthy: false,
      responseTime: Date.now() - start,
      error: (error as Error).message,
    };
  }
}

export { router as healthRouter };
