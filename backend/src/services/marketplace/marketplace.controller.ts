/**
 * Marketplace Controller
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DatabaseManager } from '../../shared/utils/database';
import { APIError, asyncHandler } from '../../shared/middleware/errorHandler';

export class MarketplaceController {
  // Get marketplace stats
  getStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const db = DatabaseManager.getInstance();

    const [
      totalVolume,
      totalSales,
      activeListings,
      activeAuctions,
      totalUsers,
      floorPrice,
    ] = await Promise.all([
      db('transactions')
        .where('type', 'sale')
        .sum('amount as total')
        .first(),
      db('transactions')
        .where('type', 'sale')
        .count('id as count')
        .first(),
      db('listings')
        .where('status', 'active')
        .count('id as count')
        .first(),
      db('listings')
        .where('status', 'active')
        .where('type', 'auction')
        .count('id as count')
        .first(),
      db('users').count('id as count').first(),
      db('listings')
        .where('status', 'active')
        .min('price as min')
        .first(),
    ]);

    res.json({
      success: true,
      data: {
        totalVolume: parseFloat((totalVolume as any).total) || 0,
        totalSales: parseInt((totalSales as any).count) || 0,
        activeListings: parseInt((activeListings as any).count) || 0,
        activeAuctions: parseInt((activeAuctions as any).count) || 0,
        totalUsers: parseInt((totalUsers as any).count) || 0,
        floorPrice: parseFloat((floorPrice as any).min) || 0,
      },
    });
  });

  // Get trending NFTs
  getTrending = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const period = req.query.period as string || '24h';
    const limit = parseInt(req.query.limit as string) || 10;
    const db = DatabaseManager.getInstance();

    const hours = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const trending = await db('transactions')
      .leftJoin('nfts', 'transactions.nft_id', 'nfts.id')
      .where('transactions.type', 'sale')
      .where('transactions.created_at', '>=', since)
      .select(
        'nfts.id',
        'nfts.name',
        'nfts.image_url',
        'nfts.price',
        db.raw('COUNT(transactions.id) as sales_count'),
        db.raw('SUM(transactions.amount) as volume')
      )
      .groupBy('nfts.id', 'nfts.name', 'nfts.image_url', 'nfts.price')
      .orderBy('volume', 'desc')
      .limit(limit);

    res.json({
      success: true,
      data: { trending },
    });
  });

  // Get featured NFTs
  getFeatured = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 8;
    const db = DatabaseManager.getInstance();

    const featured = await db('nfts')
      .leftJoin('users', 'nfts.owner_id', 'users.id')
      .where('nfts.is_featured', true)
      .orWhere('nfts.created_at', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .select('nfts.*', 'users.username as owner_username')
      .orderBy('nfts.created_at', 'desc')
      .limit(limit);

    res.json({
      success: true,
      data: { featured },
    });
  });

  // Get recent activity
  getRecentActivity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const db = DatabaseManager.getInstance();

    let query = db('activities')
      .leftJoin('users', 'activities.user_id', 'users.id')
      .leftJoin('nfts', 'activities.nft_id', 'nfts.id')
      .select(
        'activities.*',
        'users.username as user_username',
        'users.avatar as user_avatar',
        'nfts.name as nft_name',
        'nfts.image_url as nft_image'
      )
      .orderBy('activities.created_at', 'desc');

    if (type) query = query.where('activities.type', type);

    const activities = await query
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: { activities },
    });
  });

  // Get categories
  getCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const db = DatabaseManager.getInstance();

    const categories = await db('categories')
      .select('*')
      .where('is_active', true)
      .orderBy('sort_order', 'asc');

    res.json({
      success: true,
      data: { categories },
    });
  });

  // Get category by ID
  getCategoryById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    const category = await db('categories').where('id', id).first();

    if (!category) {
      throw new APIError(404, 'Category not found', 'CATEGORY_NOT_FOUND');
    }

    // Get NFTs in category
    const nfts = await db('nfts')
      .where('category_id', id)
      .limit(8);

    res.json({
      success: true,
      data: { category, nfts },
    });
  });

  // Get leaderboard
  getLeaderboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const type = req.query.type as string || 'volume';
    const period = req.query.period as string || 'all';
    const limit = parseInt(req.query.limit as string) || 10;
    const db = DatabaseManager.getInstance();

    let query = db('users')
      .leftJoin('transactions', 'users.id', 'transactions.seller_id')
      .select('users.id', 'users.username', 'users.avatar');

    if (type === 'volume') {
      query = query.sum('transactions.amount as volume');
    } else if (type === 'sales') {
      query = query.count('transactions.id as sales_count');
    } else {
      query = query.count('nfts.id as created_count')
        .leftJoin('nfts', 'users.id', 'nfts.creator_id');
    }

    if (period !== 'all') {
      const hours = period === '24h' ? 24 : period === '7d' ? 168 : 720;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      query = query.where('transactions.created_at', '>=', since);
    }

    const leaderboard = await query
      .groupBy('users.id', 'users.username', 'users.avatar')
      .orderBy(type === 'volume' ? 'volume' : type === 'sales' ? 'sales_count' : 'created_count', 'desc')
      .limit(limit);

    res.json({
      success: true,
      data: { leaderboard },
    });
  });

  // Search marketplace
  search = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { q, type } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const db = DatabaseManager.getInstance();

    const results: any = {};

    if (!type || type === 'nfts') {
      results.nfts = await db('nfts')
        .where('name', 'ilike', `%${q}%`)
        .orWhere('description', 'ilike', `%${q}%`)
        .offset((page - 1) * limit)
        .limit(limit);
    }

    if (!type || type === 'users') {
      results.users = await db('users')
        .where('username', 'ilike', `%${q}%`)
        .offset((page - 1) * limit)
        .limit(limit);
    }

    if (!type || type === 'collections') {
      results.collections = await db('collections')
        .where('name', 'ilike', `%${q}%`)
        .offset((page - 1) * limit)
        .limit(limit);
    }

    res.json({
      success: true,
      data: results,
    });
  });

  // Get gas prices
  getGasPrices = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    // Return mock gas prices - in production would fetch from TON API
    res.json({
      success: true,
      data: {
        slow: 0.001,
        average: 0.002,
        fast: 0.005,
      },
    });
  });

  // Get floor prices by category
  getFloorPrices = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const db = DatabaseManager.getInstance();

    const floorPrices = await db('categories')
      .leftJoin('nfts', 'categories.id', 'nfts.category_id')
      .leftJoin('listings', 'nfts.id', 'listings.nft_id')
      .where('listings.status', 'active')
      .select(
        'categories.id',
        'categories.name',
        'categories.image_url',
        db.raw('MIN(listings.price) as floor_price'),
        db.raw('COUNT(DISTINCT nfts.id) as item_count')
      )
      .groupBy('categories.id', 'categories.name', 'categories.image_url');

    res.json({
      success: true,
      data: { floorPrices },
    });
  });

  // Get price history for NFT
  getPriceHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { nftId } = req.params;
    const period = req.query.period as string || '30d';
    const db = DatabaseManager.getInstance();

    const days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const history = await db('transactions')
      .where('nft_id', nftId)
      .where('type', 'sale')
      .where('created_at', '>=', since)
      .select('amount', 'created_at')
      .orderBy('created_at', 'asc');

    res.json({
      success: true,
      data: { history },
    });
  });
}
