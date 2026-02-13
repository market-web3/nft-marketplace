/**
 * Admin Controller
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DatabaseManager } from '../../shared/utils/database';
import { APIError, asyncHandler } from '../../shared/middleware/errorHandler';
import { WorkerManager } from '../../workers/manager';

export class AdminController {
  private workerManager: WorkerManager;

  constructor() {
    this.workerManager = new WorkerManager();
  }

  // Dashboard stats
  getDashboardStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const db = DatabaseManager.getInstance();

    const [
      userStats,
      nftStats,
      listingStats,
      transactionStats,
      giftStats,
    ] = await Promise.all([
      db('users').count('id as total').first(),
      db('nfts').count('id as total').first(),
      db('listings').where('status', 'active').count('id as active').first(),
      db('transactions')
        .where('created_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
        .sum('amount as volume')
        .first(),
      db('offchain_gifts').where('status', 'pending').count('id as pending').first(),
    ]);

    res.json({
      success: true,
      data: {
        users: { total: parseInt((userStats as any).total) || 0 },
        nfts: { total: parseInt((nftStats as any).total) || 0 },
        listings: { active: parseInt((listingStats as any).active) || 0 },
        transactions: { volume24h: parseFloat((transactionStats as any).volume) || 0 },
        gifts: { pending: parseInt((giftStats as any).pending) || 0 },
      },
    });
  });

  // User management
  getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const isBanned = req.query.isBanned as string;
    const db = DatabaseManager.getInstance();

    let query = db('users');

    if (search) {
      query = query.where(function() {
        this.where('username', 'ilike', `%${search}%`)
          .orWhere('wallet_address', 'ilike', `%${search}%`);
      });
    }

    if (isBanned !== undefined) {
      query = query.where('is_banned', isBanned === 'true');
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
        users,
        pagination: {
          page,
          limit,
          total: parseInt(count as string),
          pages: Math.ceil(parseInt(count as string) / limit),
        },
      },
    });
  });

  banUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    await db('users')
      .where('id', id)
      .update({ is_banned: true, updated_at: new Date() });

    res.json({ success: true, message: 'User banned' });
  });

  unbanUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    await db('users')
      .where('id', id)
      .update({ is_banned: false, updated_at: new Date() });

    res.json({ success: true, message: 'User unbanned' });
  });

  // NFT management
  getNFTs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const db = DatabaseManager.getInstance();

    let query = db('nfts');
    if (status) query = query.where('status', status);

    const nfts = await query
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, data: { nfts } });
  });

  approveNFT = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    await db('nfts')
      .where('id', id)
      .update({ status: 'approved', updated_at: new Date() });

    res.json({ success: true, message: 'NFT approved' });
  });

  rejectNFT = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    await db('nfts')
      .where('id', id)
      .update({ status: 'rejected', updated_at: new Date() });

    res.json({ success: true, message: 'NFT rejected' });
  });

  // Auction management
  getAuctions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const db = DatabaseManager.getInstance();

    let query = db('auctions').leftJoin('listings', 'auctions.listing_id', 'listings.id');
    if (status) query = query.where('auctions.status', status);

    const auctions = await query
      .orderBy('auctions.created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, data: { auctions } });
  });

  cancelAuction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    await db('auctions')
      .where('id', id)
      .update({ status: 'cancelled', updated_at: new Date() });

    res.json({ success: true, message: 'Auction cancelled' });
  });

  extendAuction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const { extensionHours } = req.body;
    const db = DatabaseManager.getInstance();

    const auction = await db('auctions').where('id', id).first();
    if (!auction) {
      throw new APIError(404, 'Auction not found', 'AUCTION_NOT_FOUND');
    }

    const newEndTime = new Date(auction.end_time);
    newEndTime.setHours(newEndTime.getHours() + extensionHours);

    await db('auctions')
      .where('id', id)
      .update({ end_time: newEndTime, updated_at: new Date() });

    res.json({ success: true, message: 'Auction extended' });
  });

  // Offers management
  getOffers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const db = DatabaseManager.getInstance();

    let query = db('offers');
    if (status) query = query.where('status', status);

    const offers = await query
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, data: { offers } });
  });

  // Telegram gifts management
  getGifts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const db = DatabaseManager.getInstance();

    let query = db('offchain_gifts');
    if (status) query = query.where('status', status);

    const gifts = await query
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, data: { gifts } });
  });

  getPendingGifts = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const db = DatabaseManager.getInstance();

    const gifts = await db('offchain_gifts')
      .where('status', 'pending')
      .orderBy('created_at', 'desc');

    res.json({ success: true, data: { gifts } });
  });

  sendGift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const { recipientTelegramId } = req.body;
    const db = DatabaseManager.getInstance();

    // Update gift status
    await db('offchain_gifts')
      .where('id', id)
      .update({
        status: 'sent',
        recipient_telegram_id: recipientTelegramId,
        updated_at: new Date(),
      });

    // Queue send job
    await this.workerManager.addJob('gifts', 'send_gift', {
      giftId: id,
      recipientTelegramId,
    });

    res.json({ success: true, message: 'Gift send initiated' });
  });

  syncGifts = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    // Queue sync job with Telegram bot
    await this.workerManager.addJob('gifts', 'sync_telegram', {});

    res.json({ success: true, message: 'Gift sync initiated' });
  });

  // Settings
  getSettings = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const db = DatabaseManager.getInstance();

    const settings = await db('settings').first();

    res.json({ success: true, data: { settings } });
  });

  updateSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { marketplaceFee, minListingPrice, minWithdrawAmount } = req.body;
    const db = DatabaseManager.getInstance();

    const updates: any = { updated_at: new Date() };
    if (marketplaceFee !== undefined) updates.marketplace_fee = marketplaceFee;
    if (minListingPrice !== undefined) updates.min_listing_price = minListingPrice;
    if (minWithdrawAmount !== undefined) updates.min_withdraw_amount = minWithdrawAmount;

    await db('settings').update(updates);

    res.json({ success: true, message: 'Settings updated' });
  });

  // Reports
  getTransactionReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { startDate, endDate } = req.query;
    const db = DatabaseManager.getInstance();

    const transactions = await db('transactions')
      .whereBetween('created_at', [startDate, endDate])
      .orderBy('created_at', 'desc');

    res.json({ success: true, data: { transactions } });
  });

  getRevenueReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { period } = req.query;
    const db = DatabaseManager.getInstance();

    // Group by period
    const groupBy = period === 'daily' ? 'date' : period === 'weekly' ? 'week' : 'month';

    const revenue = await db('transactions')
      .select(
        db.raw(`DATE_TRUNC('${groupBy}', created_at) as period`),
        db.raw('SUM(amount) as revenue'),
        db.raw('COUNT(*) as count')
      )
      .where('type', 'sale')
      .groupBy('period')
      .orderBy('period', 'desc');

    res.json({ success: true, data: { revenue } });
  });

  // System health
  getSystemHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const db = DatabaseManager.getInstance();

    // Check database connection
    let dbHealthy = false;
    try {
      await db.raw('SELECT 1');
      dbHealthy = true;
    } catch (e) {
      // DB not healthy
    }

    res.json({
      success: true,
      data: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });
}
