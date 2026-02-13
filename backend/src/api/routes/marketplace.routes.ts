/**
 * Marketplace Routes
 */

import { Router } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/errorHandler';
import { RedisManager } from '../../shared/utils/redis';
import { DatabaseManager } from '../../shared/utils/database';
import { logger } from '../../shared/utils/logger';

const router = Router();

// Get marketplace stats
router.get('/stats', async (req, res, next) => {
  try {
    // Try cache first
    const cached = await RedisManager.get('marketplace:stats');
    if (cached) {
      res.json({
        success: true,
        data: cached,
      });
      return;
    }

    const db = DatabaseManager.getInstance();
    
    const [
      totalVolumeResult,
      totalTradesResult,
      activeListingsResult,
      totalNftsResult,
      volume24hResult,
    ] = await Promise.all([
      db('transactions').where('status', 'completed').sum('amount as total'),
      db('transactions').where('status', 'completed').count('* as count'),
      db('listings').where('status', 'active').count('* as count'),
      db('nfts').count('* as count'),
      db('transactions')
        .where('status', 'completed')
        .where('created_at', '>', db.raw('NOW() - INTERVAL \'24 hours\''))
        .sum('amount as total'),
    ]);

    const stats = {
      totalVolume: totalVolumeResult[0]?.total || 0,
      totalTrades: parseInt(totalTradesResult[0]?.count as string) || 0,
      activeListings: parseInt(activeListingsResult[0]?.count as string) || 0,
      totalNfts: parseInt(totalNftsResult[0]?.count as string) || 0,
      volume24h: volume24hResult[0]?.total || 0,
    };

    // Cache for 5 minutes
    await RedisManager.set('marketplace:stats', stats, 300);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Get categories
router.get('/categories', async (req, res, next) => {
  try {
    const cached = await RedisManager.get('marketplace:categories');
    if (cached) {
      res.json({
        success: true,
        data: cached,
      });
      return;
    }

    const db = DatabaseManager.getInstance();
    const categories = await db('categories')
      .select('*')
      .where('is_active', true)
      .orderBy('name');

    await RedisManager.set('marketplace:categories', categories, 600);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

// Create category (admin only)
router.post('/categories', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { name, description, imageUrl, highloadWallet } = req.body;

    const db = DatabaseManager.getInstance();
    const [category] = await db('categories')
      .insert({
        name,
        description,
        image_url: imageUrl,
        highload_wallet: highloadWallet,
      })
      .returning('*');

    // Invalidate cache
    await RedisManager.delete('marketplace:categories');

    logger.info({
      categoryId: category.id,
      name,
      adminId: req.user!.id,
    }, 'Category created');

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

// Get trending NFTs
router.get('/trending', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const cached = await RedisManager.get(`marketplace:trending:${limit}`);
    if (cached) {
      res.json({
        success: true,
        data: cached,
      });
      return;
    }

    const db = DatabaseManager.getInstance();
    
    // Get NFTs with most views/likes in last 7 days
    const trending = await db('nfts')
      .select(
        'nfts.*',
        'users.username as owner_username',
        'users.avatar_url as owner_avatar',
        'listings.price',
        'listings.type as listing_type'
      )
      .leftJoin('users', 'nfts.owner_id', 'users.id')
      .leftJoin('listings', 'nfts.id', 'listings.nft_id')
      .where('nfts.created_at', '>', db.raw('NOW() - INTERVAL \'7 days\''))
      .orderBy('nfts.views', 'desc')
      .limit(limit);

    await RedisManager.set(`marketplace:trending:${limit}`, trending, 300);

    res.json({
      success: true,
      data: trending,
    });
  } catch (error) {
    next(error);
  }
});

// Get featured NFTs
router.get('/featured', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 8;
    
    const cached = await RedisManager.get(`marketplace:featured:${limit}`);
    if (cached) {
      res.json({
        success: true,
        data: cached,
      });
      return;
    }

    const db = DatabaseManager.getInstance();
    
    const featured = await db('nfts')
      .select(
        'nfts.*',
        'users.username as owner_username',
        'users.avatar_url as owner_avatar',
        'listings.price',
        'listings.type as listing_type'
      )
      .leftJoin('users', 'nfts.owner_id', 'users.id')
      .leftJoin('listings', 'nfts.id', 'listings.nft_id')
      .where('nfts.is_featured', true)
      .where('nfts.status', 'active')
      .orderBy('nfts.featured_at', 'desc')
      .limit(limit);

    await RedisManager.set(`marketplace:featured:${limit}`, featured, 600);

    res.json({
      success: true,
      data: featured,
    });
  } catch (error) {
    next(error);
  }
});

// Get activity feed
router.get('/activity', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const db = DatabaseManager.getInstance();
    
    const activities = await db('transactions')
      .select(
        'transactions.*',
        'nfts.name as nft_name',
        'nfts.image_url as nft_image',
        'from_user.username as from_username',
        'to_user.username as to_username'
      )
      .leftJoin('nfts', 'transactions.nft_id', 'nfts.id')
      .leftJoin('users as from_user', 'transactions.from_user_id', 'from_user.id')
      .leftJoin('users as to_user', 'transactions.to_user_id', 'to_user.id')
      .where('transactions.status', 'completed')
      .orderBy('transactions.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db('transactions')
      .where('status', 'completed')
      .count('* as count');

    res.json({
      success: true,
      data: {
        items: activities,
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

// Search marketplace
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    if (!q || typeof q !== 'string') {
      throw new AppError(400, 'Search query is required', 'INVALID_QUERY');
    }

    const db = DatabaseManager.getInstance();
    
    const [nfts, users] = await Promise.all([
      db('nfts')
        .select(
          'nfts.*',
          'users.username as owner_username',
          'listings.price'
        )
        .leftJoin('users', 'nfts.owner_id', 'users.id')
        .leftJoin('listings', 'nfts.id', 'listings.nft_id')
        .where('nfts.name', 'ilike', `%${q}%`)
        .orWhere('nfts.description', 'ilike', `%${q}%`)
        .limit(limit)
        .offset(offset),
      
      db('users')
        .select('id', 'username', 'avatar_url', 'bio')
        .where('username', 'ilike', `%${q}%`)
        .limit(5),
    ]);

    res.json({
      success: true,
      data: {
        nfts,
        users,
        query: q,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as marketplaceRouter };
