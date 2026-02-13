/**
 * Webhook Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { TelegramWebhookController } from '../../services/webhook/telegram.controller';
import { authenticate, requireAdmin } from '../../shared/middleware/authenticate';

const router = Router();
const controller = new TelegramWebhookController();

// Telegram bot webhook (public)
router.post('/telegram',
  [
    body('event').isString().trim().notEmpty(),
    body('data').isObject(),
  ],
  controller.handleWebhook
);

// Get pending withdrawals (admin)
router.get('/withdrawals/pending',
  authenticate,
  requireAdmin,
  controller.getPendingWithdrawals
);

// Process withdrawal (admin)
router.post('/withdrawals/:id/process',
  authenticate,
  requireAdmin,
  [
    body('action').isIn(['approve', 'reject']),
  ],
  controller.processWithdrawal
);

export { router as webhookRouter };
