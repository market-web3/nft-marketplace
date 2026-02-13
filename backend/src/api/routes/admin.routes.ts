/**
 * Admin Routes
 */

import { Router } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/errorHandler';
import { DatabaseManager } from '../../shared/utils/database';
import { RedisManager } from '../../shared/utils/redis';
import { logger } from '../../shared/utils/logger';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Get admin dashboard stats
router.get('/dashboard', async (req: AuthRequest, res, next) => {
  try {
    const db = DatabaseManager.getInstance();

    const [
      usersCount,
      nftsCount,
      listingsCount,
      transactionsCount,
      pendingListings,
      pendingWithdrawals,
      revenue24h,
      revenue7d,
    ] = await Promise.all([
      db('users').count('* as count'),
      db('nfts').count('* as count'),
      db('listings').where('status', 'active').count('* as count'),
      db('transactions').where('status', 'completed').count('* as count'),
      db('listings').where('status', 'pending').count('* as count'),
      db('withdrawals').where('status', 'pending').count('* as count'),
      db('transactions')
        .where('status', 'completed')
        .where('created_at', '>', db.raw('NOW() - INTERVAL \'24 hours\''))
        .sum('fee as total'),
      db('transactions')
        .where('status', 'completed')
        .where('created_at', '>', db.raw('NOW() - INTERVAL \'7 days\''))
        .sum('fee as total'),
    ]);

    res.json({
      success: true,
      data: {
        users: parseInt(usersCount[0].count as string),
        nfts: parseInt(nftsCount[0].count as string),
        activeListings: parseInt(listingsCount[0].count as string),
        completedTransactions: parseInt(transactionsCount[0].count as string),
        pendingListings: parseInt(pendingListings[0].count as string),
        pendingWithdrawals: parseInt(pendingWithdrawals[0].count as string),
        revenue24h: revenue24h[0]?.total || 0,
        revenue7d: revenue7d[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get pending listings for approval
router.get('/listings/pending', async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const db = DatabaseManager.getInstance();
    
    const listings = await db('listings')
      .select(
        'listings.*',
        'nfts.name as nft_name',
        'nfts.image_url as nft_image',
        'users.username as seller_username'
      )
      .leftJoin('nfts', 'listings.nft_id', 'nfts.id')
      .leftJoin('users', 'listings.seller_id', 'users.id')
      .where('listings.status', 'pending')
      .orderBy('listings.created_at', 'asc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db('listings')
      .where('status', 'pending')
      .count('* as count');

    res.json({
      success: true,
      data: {
        items: listings,
        pagination: {
          page,
          limit,
          total: parseInt(count as string),
          totalPages: Math.ceil(parseInt(count as string) / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Approve listing
router.post('/listings/:id/approve', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    
    const db = DatabaseManager.getInstance();
    
    const [listing] = await db('listings')
      .where('id', id)
      .update({
        status: 'active',
        approved_at: new Date(),
        approved_by: req.user!.id,
      })
      .returning('*');

    if (!listing) {
      throw new AppError(404, 'Listing not found', 'LISTING_NOT_FOUND');
    }

    // Update NFT status
    await db('nfts')
      .where('id', listing.nft_id)
      .update({ status: 'listed' });

    // Invalidate caches
    await RedisManager.delete(`listing:${id}`);
    await RedisManager.delete('marketplace:stats');

    logger.info({
      listingId: id,
      adminId: req.user!.id,
    }, 'Listing approved');

    res.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
});

// Reject listing
router.post('/listings/:id/reject', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const db = DatabaseManager.getInstance();
    
    const [listing] = await db('listings')
      .where('id', id)
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date(),
        rejected_by: req.user!.id,
      })
      .returning('*');

    if (!listing) {
      throw new AppError(404, 'Listing not found', 'LISTING_NOT_FOUND');
    }

    logger.info({
      listingId: id,
      adminId: req.user!.id,
      reason,
    }, 'Listing rejected');

    res.json({
      success: true,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get('/users', async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const db = DatabaseManager.getInstance();
    
    const users = await db('users')
      .select(
        'id',
        'username',
        'wallet_address',
        'avatar_url',
        'role',
        'is_banned',
        'created_at'
      )
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db('users').count('* as count');

    res.json({
      success: true,
      data: {
        items: users,
        pagination: {
          page,
          limit,
          total: parseInt(count as string),
          totalPages: Math.ceil(parseInt(count as string) / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Ban user
router.post('/users/:id/ban', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const db = DatabaseManager.getInstance();
    
    const [user] = await db('users')
      .where('id', id)
      .update({
        is_banned: true,
        ban_reason: reason,
        banned_at: new Date(),
        banned_by: req.user!.id,
      })
      .returning('*');

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    logger.warn({
      userId: id,
      adminId: req.user!.id,
      reason,
    }, 'User banned');

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Unban user
router.post('/users/:id/unban', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const db = DatabaseManager.getInstance();
    
    const [user] = await db('users')
      .where('id', id)
      .update({
        is_banned: false,
        ban_reason: null,
        banned_at: null,
        banned_by: null,
      })
      .returning('*');

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    logger.info({
      userId: id,
      adminId: req.user!.id,
    }, 'User unbanned');

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// Get marketplace settings
router.get('/settings', async (req: AuthRequest, res, next) => {
  try {
    const db = DatabaseManager.getInstance();
    
    const settings = await db('settings')
      .select('key', 'value')
      .where('is_public', false);

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, any>);

    res.json({
      success: true,
      data: settingsMap,
    });
  } catch (error) {
    next(error);
  }
});

// Update marketplace settings
router.patch('/settings', async (req: AuthRequest, res, next) => {
  try {
    const updates = req.body;
    const db = DatabaseManager.getInstance();

    await db.transaction(async (trx) => {
      for (const [key, value] of Object.entries(updates)) {
        await trx('settings')
          .where('key', key)
          .update({
            value: JSON.stringify(value),
            updated_at: new Date(),
            updated_by: req.user!.id,
          });
      }
    });

    // Clear relevant caches
    await RedisManager.delete('marketplace:stats');
    await RedisManager.delete('marketplace:categories');

    logger.info({
      adminId: req.user!.id,
      updates: Object.keys(updates),
    }, 'Settings updated');

    res.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as adminRouter };
