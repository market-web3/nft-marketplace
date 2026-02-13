/**
 * NFT Controller
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DatabaseManager } from '../../shared/utils/database';
import { APIError, asyncHandler } from '../../shared/middleware/errorHandler';
import { WorkerManager } from '../../workers/manager';

export class NFTController {
  private workerManager: WorkerManager;

  constructor() {
    this.workerManager = new WorkerManager();
  }

  // Get all NFTs with filters
  getNFTs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const owner = req.query.owner as string;
    const status = req.query.status as string;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const search = req.query.search as string;

    const db = DatabaseManager.getInstance();
    
    let query = db('nfts')
      .leftJoin('users', 'nfts.owner_id', 'users.id')
      .leftJoin('categories', 'nfts.category_id', 'categories.id')
      .select(
        'nfts.*',
        'users.username as owner_username',
        'users.wallet_address as owner_wallet',
        'categories.name as category_name'
      );

    if (category) query = query.where('nfts.category_id', category);
    if (owner) query = query.where('nfts.owner_id', owner);
    if (status) query = query.where('nfts.status', status);
    if (minPrice !== undefined) query = query.where('nfts.price', '>=', minPrice);
    if (maxPrice !== undefined) query = query.where('nfts.price', '<=', maxPrice);
    if (search) {
      query = query.where(function() {
        this.where('nfts.name', 'ilike', `%${search}%`)
          .orWhere('nfts.description', 'ilike', `%${search}%`);
      });
    }

    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('nfts.id as count');

    const nfts = await query
      .orderBy('nfts.created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: {
        nfts,
        pagination: {
          page,
          limit,
          total: parseInt(count as string),
          pages: Math.ceil(parseInt(count as string) / limit),
        },
      },
    });
  });

  // Search NFTs
  searchNFTs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { q } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const db = DatabaseManager.getInstance();

    const nfts = await db('nfts')
      .where('name', 'ilike', `%${q}%`)
      .orWhere('description', 'ilike', `%${q}%`)
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: { nfts },
    });
  });

  // Get NFT categories
  getCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const db = DatabaseManager.getInstance();

    const categories = await db('categories')
      .select('*')
      .where('is_active', true)
      .orderBy('name');

    res.json({
      success: true,
      data: { categories },
    });
  });

  // Get NFT collections
  getCollections = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const db = DatabaseManager.getInstance();

    const collections = await db('collections')
      .select('*')
      .where('is_active', true)
      .orderBy('name');

    res.json({
      success: true,
      data: { collections },
    });
  });

  // Get NFT by ID
  getNFTById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    const nft = await db('nfts')
      .leftJoin('users', 'nfts.owner_id', 'users.id')
      .leftJoin('categories', 'nfts.category_id', 'categories.id')
      .select(
        'nfts.*',
        'users.username as owner_username',
        'users.wallet_address as owner_wallet',
        'categories.name as category_name'
      )
      .where('nfts.id', id)
      .first();

    if (!nft) {
      throw new APIError(404, 'NFT not found', 'NFT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { nft },
    });
  });

  // Get NFT by address
  getNFTByAddress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { address } = req.params;
    const db = DatabaseManager.getInstance();

    const nft = await db('nfts')
      .where('contract_address', address)
      .first();

    if (!nft) {
      throw new APIError(404, 'NFT not found', 'NFT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { nft },
    });
  });

  // Get user's NFTs
  getUserNFTs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const category = req.query.category as string;

    const db = DatabaseManager.getInstance();

    let query = db('nfts').where('owner_id', userId);

    if (status) query = query.where('status', status);
    if (category) query = query.where('category_id', category);

    const nfts = await query
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: { nfts },
    });
  });

  // Deposit NFT to marketplace
  depositNFT = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { nftAddress, categoryId, hashComment } = req.body;
    const db = DatabaseManager.getInstance();

    // Create deposit record
    const [deposit] = await db('deposits').insert({
      user_id: userId,
      nft_address: nftAddress,
      category_id: categoryId,
      hash_comment: hashComment,
      status: 'pending',
      created_at: new Date(),
    }).returning('*');

    // Queue verification job
    await this.workerManager.addJob('transactions', 'verify_deposit', {
      depositId: deposit.id,
      nftAddress,
      hashComment,
    });

    res.json({
      success: true,
      data: { deposit },
    });
  });

  // Withdraw NFT from marketplace
  withdrawNFT = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { nftId, toAddress, hashComment } = req.body;
    const db = DatabaseManager.getInstance();

    // Verify NFT ownership
    const nft = await db('nfts')
      .where('id', nftId)
      .where('owner_id', userId)
      .first();

    if (!nft) {
      throw new APIError(404, 'NFT not found or not owned by you', 'NFT_NOT_FOUND');
    }

    // Create withdrawal record
    const [withdrawal] = await db('withdrawals').insert({
      user_id: userId,
      nft_id: nftId,
      to_address: toAddress,
      hash_comment: hashComment,
      status: 'pending',
      created_at: new Date(),
    }).returning('*');

    res.json({
      success: true,
      data: { withdrawal },
    });
  });

  // Send NFT as gift
  sendGift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { nftId, recipientAddress, message } = req.body;
    const db = DatabaseManager.getInstance();

    // Verify NFT ownership
    const nft = await db('nfts')
      .where('id', nftId)
      .where('owner_id', userId)
      .first();

    if (!nft) {
      throw new APIError(404, 'NFT not found or not owned by you', 'NFT_NOT_FOUND');
    }

    // Create gift record
    const [gift] = await db('gifts').insert({
      sender_id: userId,
      nft_id: nftId,
      recipient_address: recipientAddress,
      message,
      status: 'pending',
      created_at: new Date(),
    }).returning('*');

    res.json({
      success: true,
      data: { gift },
    });
  });

  // Receive offchain gift (Telegram)
  receiveOffchainGift = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { giftId, telegramData } = req.body;
    const db = DatabaseManager.getInstance();

    // Create offchain gift record
    const [gift] = await db('offchain_gifts').insert({
      user_id: userId,
      telegram_gift_id: giftId,
      telegram_data: telegramData,
      status: 'deposited',
      created_at: new Date(),
    }).returning('*');

    res.json({
      success: true,
      data: { gift },
    });
  });

  // Get NFT metadata
  getNFTMetadata = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    const nft = await db('nfts').where('id', id).first();

    if (!nft) {
      throw new APIError(404, 'NFT not found', 'NFT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { metadata: nft.metadata },
    });
  });

  // Get NFT history
  getNFTHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const db = DatabaseManager.getInstance();

    const history = await db('nft_history')
      .where('nft_id', id)
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: { history },
    });
  });

  // Get NFT price estimate
  getPriceEstimate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    const nft = await db('nfts').where('id', id).first();

    if (!nft) {
      throw new APIError(404, 'NFT not found', 'NFT_NOT_FOUND');
    }

    // Calculate price estimate based on similar sales
    const similarSales = await db('transactions')
      .where('type', 'sale')
      .avg('amount as average')
      .first();

    const estimate = {
      min: (similarSales as any).average * 0.8 || 0,
      max: (similarSales as any).average * 1.2 || 0,
      average: parseFloat((similarSales as any).average) || 0,
    };

    res.json({
      success: true,
      data: { estimate },
    });
  });

  // Batch operations
  batchOperation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { operation, items } = req.body;
    const userId = req.user!.id;

    // Queue batch job
    await this.workerManager.addJob('transactions', 'batch_operation', {
      operation,
      items,
      userId,
    });

    res.json({
      success: true,
      message: 'Batch operation queued',
    });
  });
}
