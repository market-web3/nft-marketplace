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
    uptime: process.uptime(),
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
  };

  // Check database
  try {
    checks.database = await DatabaseManager.healthCheck();
  } catch (error) {
    logger.error('Health check - Database error:', error);
  }

  // Check Redis
  try {
    await RedisManager.getInstance().ping();
    checks.redis = true;
  } catch (error) {
    logger.error('Health check - Redis error:', error);
  }

  const allHealthy = checks.database && checks.redis;

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
  });
});

// Readiness check
router.get('/ready', async (req, res) => {
  res.json({
    ready: true,
    timestamp: new Date().toISOString(),
  });
});

// Liveness check
router.get('/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRouter };
