/**
 * User Routes
 */

import { Router } from 'express';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';
import { UserModel } from '../../shared/models/user.model';
import { AppError } from '../../shared/middleware/errorHandler';
import { RedisManager } from '../../shared/utils/redis';
import { logger } from '../../shared/utils/logger';

const router = Router();

// Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await UserModel.findById(req.user!.id);
    
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { username, avatarUrl, bio } = req.body;
    
    const user = await UserModel.update(req.user!.id, {
      username,
      avatarUrl,
      bio,
    });

    // Invalidate cache
    await RedisManager.delete(RedisManager.keys.user(req.user!.id));

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID (public)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Try cache first
    const cached = await RedisManager.get(RedisManager.keys.user(id));
    if (cached) {
      res.json({
        success: true,
        data: cached,
      });
      return;
    }

    const user = await UserModel.findById(id);
    
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Cache for 5 minutes
    await RedisManager.set(RedisManager.keys.user(id), user, 300);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Get user stats
router.get('/:id/stats', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const stats = await UserModel.getStats(id);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Get user inventory
router.get('/:id/inventory', async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const inventory = await UserModel.getInventory(id, page, limit);
    
    res.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
});

// Get user activity
router.get('/:id/activity', async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const activity = await UserModel.getActivity(id, page, limit);
    
    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
});

// Link Telegram account
router.post('/link-telegram', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { telegramId, telegramUsername } = req.body;
    
    const user = await UserModel.linkTelegram(req.user!.id, {
      telegramId,
      telegramUsername,
    });

    logger.info({
      userId: req.user!.id,
      telegramId,
    }, 'Telegram account linked');

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRouter };
