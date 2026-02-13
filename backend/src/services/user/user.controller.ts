/**
 * User Controller
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DatabaseManager } from '../../shared/utils/database';
import { APIError, asyncHandler } from '../../shared/middleware/errorHandler';

export class UserController {
  // Get all users (admin)
  getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const isActive = req.query.isActive as string;

    const db = DatabaseManager.getInstance();
    
    let query = db('users').select('*');

    if (search) {
      query = query.where(function() {
        this.where('username', 'ilike', `%${search}%`)
          .orWhere('wallet_address', 'ilike', `%${search}%`);
      });
    }

    if (isActive !== undefined) {
      query = query.where('is_active', isActive === 'true');
    }

    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('id as count');

    const users = await query
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: {
        users: users.map(this.sanitizeUser),
        pagination: {
          page,
          limit,
          total: parseInt(count as string),
          pages: Math.ceil(parseInt(count as string) / limit),
        },
      },
    });
  });

  // Get user by ID
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    const user = await db('users').where('id', id).first();

    if (!user) {
      throw new APIError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { user: this.sanitizeUser(user) },
    });
  });

  // Get current user profile
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const db = DatabaseManager.getInstance();

    const user = await db('users').where('id', userId).first();

    if (!user) {
      throw new APIError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Get additional stats
    const nftCount = await db('nfts').where('owner_id', userId).count('id as count').first();
    const listingCount = await db('listings').where('seller_id', userId).count('id as count').first();

    res.json({
      success: true,
      data: {
        user: this.sanitizeUser(user),
        stats: {
          nftCount: parseInt((nftCount as any).count),
          listingCount: parseInt((listingCount as any).count),
        },
      },
    });
  });

  // Update user profile
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { username, bio, avatar } = req.body;
    const db = DatabaseManager.getInstance();

    const updates: any = {
      updated_at: new Date(),
    };

    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;

    const [updatedUser] = await db('users')
      .where('id', userId)
      .update(updates)
      .returning('*');

    res.json({
      success: true,
      data: { user: this.sanitizeUser(updatedUser) },
    });
  });

  // Get user stats
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const db = DatabaseManager.getInstance();

    const stats = await db('transactions')
      .where('user_id', userId)
      .select(
        db.raw('COUNT(*) FILTER (WHERE type = ?) as total_purchases', ['purchase']),
        db.raw('COUNT(*) FILTER (WHERE type = ?) as total_sales', ['sale']),
        db.raw('SUM(amount) FILTER (WHERE type = ?) as total_volume', ['sale'])
      )
      .first();

    res.json({
      success: true,
      data: { stats },
    });
  });

  // Get user activity
  getActivity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const db = DatabaseManager.getInstance();

    const activities = await db('activities')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: { activities },
    });
  });

  // Get user notifications
  getNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const db = DatabaseManager.getInstance();

    let query = db('notifications').where('user_id', userId);

    if (unreadOnly) {
      query = query.where('is_read', false);
    }

    const notifications = await query
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    const unreadCount = await db('notifications')
      .where('user_id', userId)
      .where('is_read', false)
      .count('id as count')
      .first();

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: parseInt((unreadCount as any).count),
      },
    });
  });

  // Mark notification as read
  markNotificationRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    await db('notifications')
      .where('id', id)
      .where('user_id', userId)
      .update({ is_read: true, read_at: new Date() });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  });

  // Ban user (admin)
  banUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    await db('users')
      .where('id', id)
      .update({ is_banned: true, updated_at: new Date() });

    res.json({
      success: true,
      message: 'User banned successfully',
    });
  });

  // Unban user (admin)
  unbanUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    await db('users')
      .where('id', id)
      .update({ is_banned: false, updated_at: new Date() });

    res.json({
      success: true,
      message: 'User unbanned successfully',
    });
  });

  // Link Telegram account
  linkTelegram = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { telegramId, code } = req.body;
    const db = DatabaseManager.getInstance();

    // Verify linking code with Telegram bot
    // This would check the code against Redis or the bot service

    await db('users')
      .where('id', userId)
      .update({
        telegram_id: telegramId,
        updated_at: new Date(),
      });

    res.json({
      success: true,
      message: 'Telegram account linked successfully',
    });
  });

  private sanitizeUser(user: any): any {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}
