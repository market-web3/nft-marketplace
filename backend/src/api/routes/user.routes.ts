/**
 * User Routes
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { UserController } from '../../services/user/user.controller';
import { authenticate, requireAdmin } from '../../shared/middleware/authenticate';

const router = Router();
const controller = new UserController();

// Get all users (admin only)
router.get('/',
  authenticate,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('isActive').optional().isBoolean(),
  ],
  controller.getUsers
);

// Get user by ID
router.get('/:id',
  authenticate,
  param('id').isUUID(),
  controller.getUserById
);

// Get current user profile
router.get('/me/profile',
  authenticate,
  controller.getProfile
);

// Update user profile
router.patch('/me/profile',
  authenticate,
  [
    body('username').optional().isString().isLength({ min: 3, max: 30 }),
    body('bio').optional().isString().isLength({ max: 500 }),
    body('avatar').optional().isURL(),
  ],
  controller.updateProfile
);

// Get user stats
router.get('/me/stats',
  authenticate,
  controller.getStats
);

// Get user activity
router.get('/me/activity',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  controller.getActivity
);

// Get user notifications
router.get('/me/notifications',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('unreadOnly').optional().isBoolean(),
  ],
  controller.getNotifications
);

// Mark notification as read
router.patch('/me/notifications/:id/read',
  authenticate,
  param('id').isUUID(),
  controller.markNotificationRead
);

// Ban user (admin only)
router.post('/:id/ban',
  authenticate,
  requireAdmin,
  param('id').isUUID(),
  controller.banUser
);

// Unban user (admin only)
router.post('/:id/unban',
  authenticate,
  requireAdmin,
  param('id').isUUID(),
  controller.unbanUser
);

// Link Telegram account
router.post('/me/link-telegram',
  authenticate,
  [
    body('telegramId').isString().trim().notEmpty(),
    body('code').isString().trim().notEmpty(),
  ],
  controller.linkTelegram
);

export { router as userRouter };
