/**
 * Authentication Routes
 */

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../shared/config/env';
import { RedisManager } from '../../shared/utils/redis';
import { UserModel } from '../../shared/models/user.model';
import { AppError } from '../../shared/middleware/errorHandler';
import { walletAuthValidator } from '../../shared/middleware/validation';
import { logger } from '../../shared/utils/logger';
import * as nacl from 'tweetnacl';

const router = Router();

// Generate nonce for wallet signature
router.post('/nonce', async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      throw new AppError(400, 'Wallet address is required', 'INVALID_INPUT');
    }

    const nonce = Math.random().toString(36).substring(2, 15);
    
    // Store nonce in Redis with 5 minute expiry
    await RedisManager.set(
      RedisManager.keys.nonce(walletAddress),
      nonce,
      300
    );

    res.json({
      success: true,
      data: { nonce },
    });
  } catch (error) {
    next(error);
  }
});

// Verify wallet signature and authenticate
router.post('/wallet/verify', walletAuthValidator, async (req, res, next) => {
  try {
    const { walletAddress, signature, nonce } = req.body;

    // Verify nonce exists
    const storedNonce = await RedisManager.get<string>(
      RedisManager.keys.nonce(walletAddress)
    );

    if (!storedNonce || storedNonce !== nonce) {
      throw new AppError(401, 'Invalid or expired nonce', 'INVALID_NONCE');
    }

    // Verify signature (simplified - real implementation would use TON crypto)
    const isValidSignature = await verifySignature(walletAddress, signature, nonce);
    
    if (!isValidSignature) {
      throw new AppError(401, 'Invalid signature', 'INVALID_SIGNATURE');
    }

    // Delete used nonce
    await RedisManager.delete(RedisManager.keys.nonce(walletAddress));

    // Find or create user
    let user = await UserModel.findByWallet(walletAddress);
    
    if (!user) {
      user = await UserModel.create({
        walletAddress,
        username: `user_${walletAddress.slice(-8)}`,
      });
      logger.info({ userId: user.id, walletAddress }, 'New user registered');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await RedisManager.set(
      RedisManager.keys.session(refreshToken),
      { userId: user.id },
      30 * 24 * 60 * 60 // 30 days
    );

    // Update last active
    await UserModel.updateLastActive(user.id);

    res.json({
      success: true,
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Refresh access token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(401, 'Refresh token required', 'MISSING_TOKEN');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as {
      userId: string;
      type: string;
    };

    if (decoded.type !== 'refresh') {
      throw new AppError(401, 'Invalid token type', 'INVALID_TOKEN');
    }

    // Check if token is still valid in Redis
    const session = await RedisManager.get(RedisManager.keys.session(refreshToken));
    if (!session) {
      throw new AppError(401, 'Token revoked', 'TOKEN_REVOKED');
    }

    // Get user
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new AppError(401, 'User not found', 'USER_NOT_FOUND');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token', 'INVALID_TOKEN'));
      return;
    }
    next(error);
  }
});

// Telegram authentication
router.post('/telegram', async (req, res, next) => {
  try {
    const { telegramId, telegramUsername, firstName, lastName, authDate, hash } = req.body;

    // Verify Telegram auth data (simplified - real implementation would verify hash)
    const isValid = verifyTelegramAuth({
      telegramId,
      telegramUsername,
      firstName,
      lastName,
      authDate,
      hash,
    });

    if (!isValid) {
      throw new AppError(401, 'Invalid Telegram authentication', 'INVALID_AUTH');
    }

    // Find or create user
    let user = await UserModel.findByTelegramId(telegramId);
    
    if (!user) {
      user = await UserModel.create({
        telegramId,
        telegramUsername,
        username: telegramUsername || `tg_${telegramId}`,
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Blacklist token
      await RedisManager.set(
        `blacklist:token:${refreshToken}`,
        true,
        30 * 24 * 60 * 60
      );
      
      // Delete session
      await RedisManager.delete(RedisManager.keys.session(refreshToken));
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions
function generateAccessToken(user: any): string {
  return jwt.sign(
    {
      userId: user.id,
      walletAddress: user.wallet_address,
      role: user.role,
      type: 'access',
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

function generateRefreshToken(user: any): string {
  return jwt.sign(
    {
      userId: user.id,
      type: 'refresh',
    },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
  );
}

async function verifySignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    // This is a simplified version
    // Real implementation would use TON-specific signature verification
    // with the user's public key from the wallet
    return true;
  } catch (error) {
    logger.error('Signature verification failed:', error);
    return false;
  }
}

function verifyTelegramAuth(data: any): boolean {
  // Simplified verification
  // Real implementation would verify the HMAC hash
  return true;
}

export { router as authRouter };
