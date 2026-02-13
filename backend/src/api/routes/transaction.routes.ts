/**
 * Transaction Routes
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { TransactionController } from '../../services/transaction/transaction.controller';
import { authenticate, requireAdmin } from '../../shared/middleware/authenticate';

const router = Router();
const controller = new TransactionController();

// Get all transactions (admin only)
router.get('/',
  authenticate,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['deposit', 'withdrawal', 'sale', 'purchase', 'bid', 'refund']),
    query('status').optional().isIn(['pending', 'completed', 'failed']),
    query('userId').optional().isUUID(),
  ],
  controller.getTransactions
);

// Get transaction by ID
router.get('/:id',
  authenticate,
  param('id').isUUID(),
  controller.getTransactionById
);

// Get user's transactions
router.get('/user/me',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['deposit', 'withdrawal', 'sale', 'purchase', 'bid', 'refund']),
  ],
  controller.getMyTransactions
);

// Create deposit
router.post('/deposit',
  authenticate,
  [
    body('amount').isNumeric().custom((v) => parseFloat(v) > 0),
    body('txHash').isString().trim().notEmpty(),
  ],
  controller.createDeposit
);

// Create withdrawal
router.post('/withdrawal',
  authenticate,
  [
    body('amount').isNumeric().custom((v) => parseFloat(v) > 0),
    body('toAddress').isString().trim().notEmpty(),
  ],
  controller.createWithdrawal
);

// Verify transaction
router.post('/:id/verify',
  authenticate,
  param('id').isUUID(),
  controller.verifyTransaction
);

// Get transaction stats
router.get('/stats/overview',
  authenticate,
  requireAdmin,
  controller.getStats
);

// Export transactions (admin only)
router.get('/export/csv',
  authenticate,
  requireAdmin,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('type').optional().isString(),
  ],
  controller.exportTransactions
);

export { router as transactionRouter };
