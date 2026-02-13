/**
 * Admin Routes
 * Administrative operations
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { AdminController } from '../../services/admin/admin.controller';
import { authenticate, requireAdmin } from '../../shared/middleware/authenticate';

const router = Router();
const controller = new AdminController();

// All routes require admin access
router.use(authenticate, requireAdmin);

// Dashboard stats
router.get('/dashboard', controller.getDashboardStats);

// User management
router.get('/users',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('isBanned').optional().isBoolean(),
  ],
  controller.getUsers
);

router.post('/users/:id/ban', param('id').isUUID(), controller.banUser);
router.post('/users/:id/unban', param('id').isUUID(), controller.unbanUser);

// NFT management
router.get('/nfts',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'approved', 'rejected']),
  ],
  controller.getNFTs
);

router.post('/nfts/:id/approve', param('id').isUUID(), controller.approveNFT);
router.post('/nfts/:id/reject', param('id').isUUID(), controller.rejectNFT);

// Auction management
router.get('/auctions',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'ended', 'cancelled']),
  ],
  controller.getAuctions
);

router.post('/auctions/:id/cancel', param('id').isUUID(), controller.cancelAuction);
router.post('/auctions/:id/extend',
  param('id').isUUID(),
  body('extensionHours').isInt({ min: 1, max: 168 }),
  controller.extendAuction
);

// Offers management
router.get('/offers',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'accepted', 'rejected', 'expired']),
  ],
  controller.getOffers
);

// Telegram gifts management
router.get('/gifts',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['deposited', 'withdrawn', 'pending']),
  ],
  controller.getGifts
);

router.get('/gifts/pending', controller.getPendingGifts);

router.post('/gifts/:id/send',
  param('id').isUUID(),
  body('recipientTelegramId').isString().trim().notEmpty(),
  controller.sendGift
);

router.post('/gifts/sync', controller.syncGifts);

// Settings
router.get('/settings', controller.getSettings);

router.patch('/settings',
  [
    body('marketplaceFee').optional().isInt({ min: 0, max: 1000 }),
    body('minListingPrice').optional().isNumeric(),
    body('minWithdrawAmount').optional().isNumeric(),
  ],
  controller.updateSettings
);

// Reports
router.get('/reports/transactions',
  [
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
  ],
  controller.getTransactionReport
);

router.get('/reports/revenue',
  [
    query('period').isIn(['daily', 'weekly', 'monthly']),
  ],
  controller.getRevenueReport
);

// System health
router.get('/health', controller.getSystemHealth);

export { router as adminRouter };
