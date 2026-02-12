import { Redis } from 'ioredis';

interface User {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  linkedWallet?: string;
  linkedWebsiteUserId?: string;
  createdAt: string;
  lastActive: string;
}

interface UserBalance {
  ton: number;
  nftCount: number;
  virtualBalance: number;
}

export class UserManager {
  private redis: Redis;
  private readonly USER_PREFIX = 'user:';
  private readonly LINKING_CODE_PREFIX = 'linking_code:';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async registerUser(userData: {
    telegramId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const existingUser = await this.getUser(userData.telegramId);
    
    if (existingUser) {
      // Update last active
      existingUser.lastActive = new Date().toISOString();
      await this.redis.setex(
        `${this.USER_PREFIX}${userData.telegramId}`,
        60 * 60 * 24 * 365,
        JSON.stringify(existingUser)
      );
      return existingUser;
    }

    const user: User = {
      ...userData,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    await this.redis.setex(
      `${this.USER_PREFIX}${userData.telegramId}`,
      60 * 60 * 24 * 365, // 1 year expiry
      JSON.stringify(user)
    );

    return user;
  }

  async getUser(telegramId: string): Promise<User | null> {
    const userData = await this.redis.get(`${this.USER_PREFIX}${telegramId}`);
    return userData ? JSON.parse(userData) : null;
  }

  async generateLinkingCode(telegramId: string): Promise<string> {
    // Generate a 6-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Store code with 10 minute expiry
    await this.redis.setex(
      `${this.LINKING_CODE_PREFIX}${code}`,
      600, // 10 minutes
      telegramId
    );

    return code;
  }

  async verifyLinkingCode(code: string): Promise<string | null> {
    const telegramId = await this.redis.get(`${this.LINKING_CODE_PREFIX}${code}`);
    
    if (telegramId) {
      // Delete the code after use
      await this.redis.del(`${this.LINKING_CODE_PREFIX}${code}`);
    }

    return telegramId;
  }

  async linkWebsiteAccount(telegramId: string, websiteUserId: string): Promise<boolean> {
    const user = await this.getUser(telegramId);
    if (!user) return false;

    user.linkedWebsiteUserId = websiteUserId;
    user.lastActive = new Date().toISOString();

    await this.redis.setex(
      `${this.USER_PREFIX}${telegramId}`,
      60 * 60 * 24 * 365,
      JSON.stringify(user)
    );

    return true;
  }

  async linkWallet(telegramId: string, walletAddress: string): Promise<boolean> {
    const user = await this.getUser(telegramId);
    if (!user) return false;

    user.linkedWallet = walletAddress;
    user.lastActive = new Date().toISOString();

    await this.redis.setex(
      `${this.USER_PREFIX}${telegramId}`,
      60 * 60 * 24 * 365,
      JSON.stringify(user)
    );

    return true;
  }

  async getBalance(telegramId: string): Promise<UserBalance> {
    // In a real implementation, this would fetch from the backend API
    // For now, return mock data
    return {
      ton: 125.5,
      nftCount: 12,
      virtualBalance: 50.0,
    };
  }

  async getUserCount(): Promise<number> {
    const keys = await this.redis.keys(`${this.USER_PREFIX}*`);
    return keys.length;
  }

  async getActiveUsersCount(days: number = 7): Promise<number> {
    const keys = await this.redis.keys(`${this.USER_PREFIX}*`);
    let activeCount = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const key of keys) {
      const userData = await this.redis.get(key);
      if (userData) {
        const user: User = JSON.parse(userData);
        if (new Date(user.lastActive) > cutoffDate) {
          activeCount++;
        }
      }
    }

    return activeCount;
  }
}
