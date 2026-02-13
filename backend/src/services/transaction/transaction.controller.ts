/**
 * Transaction Controller
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DatabaseManager } from '../../shared/utils/database';
import { APIError, asyncHandler } from '../../shared/middleware/errorHandler';
import { WorkerManager } from '../../workers/manager';

export class TransactionController {
  private workerManager: WorkerManager;

  constructor() {
    this.workerManager = new WorkerManager();
  }

  // Get all transactions (admin)
  getTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const status = req.query.status as string;
    const userId = req.query.userId as string;
    const db = DatabaseManager.getInstance();

    let query = db('transactions')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .select('transactions.*', 'users.username as user_username');

    if (type) query = query.where('transactions.type', type);
    if (status) query = query.where('transactions.status', status);
    if (userId) query = query.where('transactions.user_id', userId);

    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('transactions.id as count');

    const transactions = await query
      .orderBy('transactions.created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total: parseInt(count as string),
          pages: Math.ceil(parseInt(count as string) / limit),
        },
      },
    });
  });

  // Get transaction by ID
  getTransactionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    const transaction = await db('transactions')
      .leftJoin('users', 'transactions.user_id', 'users.id')
      .select('transactions.*', 'users.username as user_username')
      .where('transactions.id', id)
      .first();

    if (!transaction) {
      throw new APIError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { transaction },
    });
  });

  // Get user's transactions
  getMyTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const db = DatabaseManager.getInstance();

    let query = db('transactions')
      .where(function() {
        this.where('user_id', userId)
          .orWhere('seller_id', userId)
          .orWhere('buyer_id', userId);
      });

    if (type) query = query.where('type', type);

    const transactions = await query
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: { transactions },
    });
  });

  // Create deposit
  createDeposit = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { amount, txHash } = req.body;
    const db = DatabaseManager.getInstance();

    const [transaction] = await db('transactions').insert({
      user_id: userId,
      type: 'deposit',
      amount,
      tx_hash: txHash,
      status: 'pending',
      created_at: new Date(),
    }).returning('*');

    // Queue verification job
    await this.workerManager.addJob('transactions', 'verify_transaction', {
      transactionId: transaction.id,
      txHash,
      type: 'deposit',
    });

    res.json({
      success: true,
      data: { transaction },
    });
  });

  // Create withdrawal
  createWithdrawal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { amount, toAddress } = req.body;
    const db = DatabaseManager.getInstance();

    // Check user balance
    const user = await db('users').where('id', userId).first();
    if (user.balance < amount) {
      throw new APIError(400, 'Insufficient balance', 'INSUFFICIENT_BALANCE');
    }

    const [transaction] = await db('transactions').insert({
      user_id: userId,
      type: 'withdrawal',
      amount,
      to_address: toAddress,
      status: 'pending',
      created_at: new Date(),
    }).returning('*');

    res.json({
      success: true,
      data: { transaction },
    });
  });

  // Verify transaction
  verifyTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    const transaction = await db('transactions').where('id', id).first();
    if (!transaction) {
      throw new APIError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
    }

    // Queue verification job
    await this.workerManager.addJob('transactions', 'verify_transaction', {
      transactionId: id,
      txHash: transaction.tx_hash,
      type: transaction.type,
    });

    res.json({
      success: true,
      message: 'Verification initiated',
    });
  });

  // Get transaction stats
  getStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const db = DatabaseManager.getInstance();

    const stats = await db('transactions')
      .select(
        db.raw("COUNT(*) FILTER (WHERE type = 'deposit') as deposits"),
        db.raw("COUNT(*) FILTER (WHERE type = 'withdrawal') as withdrawals"),
        db.raw("COUNT(*) FILTER (WHERE type = 'sale') as sales"),
        db.raw("SUM(amount) FILTER (WHERE type = 'sale') as volume"),
        db.raw("SUM(fee) as total_fees")
      )
      .first();

    res.json({
      success: true,
      data: { stats },
    });
  });

  // Export transactions
  exportTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { startDate, endDate, type } = req.query;
    const db = DatabaseManager.getInstance();

    let query = db('transactions')
      .whereBetween('created_at', [startDate, endDate]);

    if (type) query = query.where('type', type);

    const transactions = await query.orderBy('created_at', 'desc');

    // Convert to CSV
    const csv = this.convertToCSV(transactions);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  });

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }
}
