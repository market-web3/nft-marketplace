/**
 * Authentication Routes
 * Wallet connection and Telegram auth
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthController } from '../../services/user/auth.controller';
import { authenticate } from '../../shared/middleware/authenticate';

const router = Router();
const controller = new AuthController();

// Generate nonce for wallet signature
router.post(
  '/nonce',
  body('walletAddress').isString().trim().notEmpty(),
  controller.generateNonce
);

// Verify wallet signature and login
router.post(
  '/wallet/verify',
  [
    body('walletAddress').isString().trim().notEmpty(),
    body('signature').isString().trim().notEmpty(),
    body('nonce').isString().trim().notEmpty(),
  ],
  controller.verifyWallet
);

// Telegram authentication
router.post(
  '/telegram',
  [
    body('telegramId').isString().trim().notEmpty(),
    body('username').optional().isString(),
    body('initData').isString().trim().notEmpty(),
  ],
  controller.telegramAuth
);

// Link wallet to existing account
router.post(
  '/link-wallet',
  authenticate,
  [
    body('walletAddress').isString().trim().notEmpty(),
    body('signature').isString().trim().notEmpty(),
    body('nonce').isString().trim().notEmpty(),
  ],
  controller.linkWallet
);

// Link Telegram to existing account
router.post(
  '/link-telegram',
  authenticate,
  [
    body('telegramId').isString().trim().notEmpty(),
    body('initData').isString().trim().notEmpty(),
  ],
  controller.linkTelegram
);

// Refresh token
router.post('/refresh', controller.refreshToken);

// Logout
router.post('/logout', authenticate, controller.logout);

// Get current user
router.get('/me', authenticate, controller.getCurrentUser);

export { router as authRouter };
