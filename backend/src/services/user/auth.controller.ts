/**
 * Authentication Controller
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../shared/config/env';
import { DatabaseManager } from '../../shared/utils/database';
import { RedisManager } from '../../shared/utils/redis';
import { APIError, asyncHandler } from '../../shared/middleware/errorHandler';
import { logger } from '../../shared/utils/logger';

export class AuthController {
  // Generate nonce for wallet signature
  generateNonce = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { walletAddress } = req.body;
    
    // Generate random nonce
    const nonce = crypto.randomBytes(32).toString('hex');
    
    // Store nonce in Redis with 10 minute expiry
    await RedisManager.set(
      RedisManager.keys.nonce(walletAddress),
      { nonce, createdAt: Date.now() },
      600
    );

    res.json({
      success: true,
      data: { nonce, expiresIn: 600 },
    });
  });

  // Verify wallet signature and login
  verifyWallet = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { walletAddress, signature, nonce } = req.body;
    const db = DatabaseManager.getInstance();

    // Verify nonce exists
    const storedData = await RedisManager.get<{ nonce: string; createdAt: number }>(
      RedisManager.keys.nonce(walletAddress)
    );

    if (!storedData || storedData.nonce !== nonce) {
      throw new APIError(400, 'Invalid or expired nonce', 'INVALID_NONCE');
    }

    // Verify signature (simplified - would use TON crypto library in production)
    const isValidSignature = this.verifySignature(walletAddress, signature, nonce);
    if (!isValidSignature) {
      throw new APIError(401, 'Invalid signature', 'INVALID_SIGNATURE');
    }

    // Delete used nonce
    await RedisManager.delete(RedisManager.keys.nonce(walletAddress));

    // Find or create user
    let user = await db('users')
      .where('wallet_address', walletAddress.toLowerCase())
      .first();

    if (!user) {
      // Create new user
      const [newUser] = await db('users')
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          username: `user_${walletAddress.slice(-8)}`,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');
      user = newUser;
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    res.json({
      success: true,
      data: {
        user: this.sanitizeUser(user),
        tokens,
      },
    });
  });

  // Telegram authentication
  telegramAuth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { telegramId, username, initData } = req.body;
    const db = DatabaseManager.getInstance();

    // Verify Telegram initData (simplified - would validate hash in production)
    const isValidInitData = this.verifyTelegramInitData(initData);
    if (!isValidInitData) {
      throw new APIError(401, 'Invalid Telegram data', 'INVALID_TELEGRAM_DATA');
    }

    // Find or create user
    let user = await db('users')
      .where('telegram_id', telegramId)
      .first();

    if (!user) {
      const [newUser] = await db('users')
        .insert({
          telegram_id: telegramId,
          telegram_username: username,
          username: username || `tg_${telegramId.slice(-8)}`,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');
      user = newUser;
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    res.json({
      success: true,
      data: {
        user: this.sanitizeUser(user),
        tokens,
      },
    });
  });

  // Link wallet to existing account
  linkWallet = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { walletAddress, signature, nonce } = req.body;
    const userId = req.user!.id;
    const db = DatabaseManager.getInstance();

    // Verify nonce and signature
    const storedData = await RedisManager.get<{ nonce: string }>(
      RedisManager.keys.nonce(walletAddress)
    );

    if (!storedData || storedData.nonce !== nonce) {
      throw new APIError(400, 'Invalid or expired nonce', 'INVALID_NONCE');
    }

    // Check if wallet is already linked
    const existingUser = await db('users')
      .where('wallet_address', walletAddress.toLowerCase())
      .first();

    if (existingUser && existingUser.id !== userId) {
      throw new APIError(409, 'Wallet already linked to another account', 'WALLET_EXISTS');
    }

    // Update user
    await db('users')
      .where('id', userId)
      .update({
        wallet_address: walletAddress.toLowerCase(),
        updated_at: new Date(),
      });

    await RedisManager.delete(RedisManager.keys.nonce(walletAddress));

    res.json({
      success: true,
      message: 'Wallet linked successfully',
    });
  });

  // Link Telegram to existing account
  linkTelegram = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { telegramId, initData } = req.body;
    const userId = req.user!.id;
    const db = DatabaseManager.getInstance();

    // Verify Telegram data
    const isValidInitData = this.verifyTelegramInitData(initData);
    if (!isValidInitData) {
      throw new APIError(401, 'Invalid Telegram data', 'INVALID_TELEGRAM_DATA');
    }

    // Check if Telegram is already linked
    const existingUser = await db('users')
      .where('telegram_id', telegramId)
      .first();

    if (existingUser && existingUser.id !== userId) {
      throw new APIError(409, 'Telegram already linked to another account', 'TELEGRAM_EXISTS');
    }

    // Update user
    await db('users')
      .where('id', userId)
      .update({
        telegram_id: telegramId,
        updated_at: new Date(),
      });

    res.json({
      success: true,
      message: 'Telegram linked successfully',
    });
  });

  // Refresh token
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new APIError(400, 'Refresh token required', 'TOKEN_REQUIRED');
    }

    try {
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as any;
      
      // Generate new tokens
      const tokens = this.generateTokens({ id: decoded.id });

      res.json({
        success: true,
        data: { tokens },
      });
    } catch (error) {
      throw new APIError(401, 'Invalid refresh token', 'INVALID_TOKEN');
    }
  });

  // Logout
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Add token to blacklist
      await RedisManager.set(
        `blacklist:${token}`,
        { revokedAt: Date.now() },
        24 * 60 * 60 // 24 hours
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  // Get current user
  getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const db = DatabaseManager.getInstance();

    const user = await db('users')
      .where('id', userId)
      .first();

    if (!user) {
      throw new APIError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { user: this.sanitizeUser(user) },
    });
  });

  // Helper methods
  private verifySignature(walletAddress: string, signature: string, nonce: string): boolean {
    // Simplified verification - would use proper TON crypto in production
    try {
      // Verify signature logic here
      return true; // Placeholder
    } catch (error) {
      logger.error('Signature verification error:', error);
      return false;
    }
  }

  private verifyTelegramInitData(initData: string): boolean {
    // Simplified verification - would verify HMAC in production
    return true; // Placeholder
  }

  private generateTokens(user: any): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { id: user.id, isAdmin: user.is_admin },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any): any {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}
