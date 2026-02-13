/**
 * Transaction Routes
 */

import { Router } from 'express';
import { authenticate, AuthRequest } from '../../shared/middleware/auth';
import { TransactionModel } from '../../shared/models/transaction.model';
import { AppError } from '../../shared/middleware/errorHandler';
import { paginationValidator } from '../../shared/middleware/validation';
import { logger } from '../../shared/utils/logger';

const router = Router();

// Get all transactions (with filters)
router.get('/', paginationValidator, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      type: req.query.type as string,
      status: req.query.status as string,
      userId: req.query.userId as string,
      nftId: req.query.nftId as string,
    };

    const transactions = await TransactionModel.findAll(filters, page, limit);

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const transaction = await TransactionModel.findById(id);
    
    if (!transaction) {
      throw new AppError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
});

// Get transaction by hash
router.get('/hash/:hash', async (req, res, next) => {
  try {
    const { hash } = req.params;
    
    const transaction = await TransactionModel.findByHash(hash);
    
    if (!transaction) {
      throw new AppError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
});

// Create transaction record
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const transactionData = {
      ...req.body,
      fromUserId: req.user!.id,
    };

    const transaction = await TransactionModel.create(transactionData);

    logger.info({
      transactionId: transaction.id,
      type: transaction.type,
      userId: req.user!.id,
    }, 'Transaction created');

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
});

// Update transaction status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { status, blockHeight, confirmationCount } = req.body;

    const transaction = await TransactionModel.updateStatus(id, {
      status,
      blockHeight,
      confirmationCount,
    });

    logger.info({
      transactionId: id,
      status,
    }, 'Transaction status updated');

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
});

// Get user's transactions
router.get('/user/me', authenticate, paginationValidator, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const transactions = await TransactionModel.findByUser(req.user!.id, page, limit);

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
});

// Retry failed transaction
router.post('/:id/retry', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await TransactionModel.findById(id);
    
    if (!transaction) {
      throw new AppError(404, 'Transaction not found', 'TRANSACTION_NOT_FOUND');
    }

    if (transaction.fromUserId !== req.user!.id && req.user!.role !== 'admin') {
      throw new AppError(403, 'Not authorized', 'FORBIDDEN');
    }

    if (transaction.status !== 'failed') {
      throw new AppError(400, 'Only failed transactions can be retried', 'INVALID_STATUS');
    }

    const updated = await TransactionModel.retry(id);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

export { router as transactionRouter };
