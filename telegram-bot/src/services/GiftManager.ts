import { Redis } from 'ioredis';
import TelegramBot from 'node-telegram-bot-api';

interface Gift {
  id: string;
  name: string;
  value: number;
  status: 'deposited' | 'withdrawn' | 'pending';
  telegramId: string;
  depositedAt: string;
  withdrawnAt?: string;
}

interface WithdrawalRequest {
  id: string;
  giftId: string;
  telegramId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export class GiftManager {
  private redis: Redis;
  private bot: TelegramBot;
  private readonly GIFT_PREFIX = 'gift:';
  private readonly USER_GIFTS_PREFIX = 'user_gifts:';
  private readonly WITHDRAWAL_PREFIX = 'withdrawal:';

  constructor(redis: Redis, bot: TelegramBot) {
    this.redis = redis;
    this.bot = bot;
  }

  async depositGift({
    telegramId,
    giftData,
    source,
  }: {
    telegramId: string;
    giftData: { name: string; value: number; id?: string };
    source: string;
  }): Promise<Gift> {
    const giftId = giftData.id || `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const gift: Gift = {
      id: giftId,
      name: giftData.name,
      value: giftData.value,
      status: 'deposited',
      telegramId,
      depositedAt: new Date().toISOString(),
    };

    // Store gift data
    await this.redis.setex(
      `${this.GIFT_PREFIX}${giftId}`,
      60 * 60 * 24 * 365, // 1 year expiry
      JSON.stringify(gift)
    );

    // Add to user's gift list
    await this.redis.sadd(`${this.USER_GIFTS_PREFIX}${telegramId}`, giftId);

    // Notify backend about deposit
    await this.notifyBackend('gift_deposited', { gift, source });

    return gift;
  }

  async createWithdrawalRequest({
    giftId,
    telegramId,
    status,
  }: {
    giftId: string;
    telegramId: string;
    status: string;
  }): Promise<WithdrawalRequest> {
    const requestId = `wd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request: WithdrawalRequest = {
      id: requestId,
      giftId,
      telegramId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Store withdrawal request
    await this.redis.setex(
      `${this.WITHDRAWAL_PREFIX}${requestId}`,
      60 * 60 * 24 * 7, // 7 days expiry
      JSON.stringify(request)
    );

    // Add to pending withdrawals set
    await this.redis.sadd('pending_withdrawals', requestId);

    // Update gift status
    const giftData = await this.redis.get(`${this.GIFT_PREFIX}${giftId}`);
    if (giftData) {
      const gift: Gift = JSON.parse(giftData);
      gift.status = 'pending';
      await this.redis.setex(
        `${this.GIFT_PREFIX}${giftId}`,
        60 * 60 * 24 * 365,
        JSON.stringify(gift)
      );
    }

    // Notify backend
    await this.notifyBackend('withdrawal_requested', { request, giftId });

    return request;
  }

  async sendGiftToUser(giftId: string, recipientTelegramId: string): Promise<boolean> {
    try {
      const giftData = await this.redis.get(`${this.GIFT_PREFIX}${giftId}`);
      if (!giftData) {
        throw new Error('Gift not found');
      }

      const gift: Gift = JSON.parse(giftData);

      // Send gift via Telegram (using bot's gift feature or message)
      // Note: Actual implementation depends on Telegram's gift API
      await this.bot.sendMessage(
        parseInt(recipientTelegramId),
        `🎁 <b>You received a gift!</b>\n\nName: ${gift.name}\nValue: ${gift.value} TON\n\nThis gift was sent from your NFT marketplace inventory.`,
        { parse_mode: 'HTML' }
      );

      // Update gift status
      gift.status = 'withdrawn';
      gift.withdrawnAt = new Date().toISOString();
      await this.redis.setex(
        `${this.GIFT_PREFIX}${giftId}`,
        60 * 60 * 24 * 365,
        JSON.stringify(gift)
      );

      // Update withdrawal request status
      const withdrawalIds = await this.redis.smembers('pending_withdrawals');
      for (const withdrawalId of withdrawalIds) {
        const requestData = await this.redis.get(`${this.WITHDRAWAL_PREFIX}${withdrawalId}`);
        if (requestData) {
          const request: WithdrawalRequest = JSON.parse(requestData);
          if (request.giftId === giftId) {
            request.status = 'completed';
            request.completedAt = new Date().toISOString();
            await this.redis.setex(
              `${this.WITHDRAWAL_PREFIX}${withdrawalId}`,
              60 * 60 * 24 * 30,
              JSON.stringify(request)
            );
            await this.redis.srem('pending_withdrawals', withdrawalId);
            break;
          }
        }
      }

      // Remove from user's gift list
      await this.redis.srem(`${this.USER_GIFTS_PREFIX}${gift.telegramId}`, giftId);

      // Notify backend
      await this.notifyBackend('gift_withdrawn', { gift, recipientTelegramId });

      return true;
    } catch (error) {
      console.error('Error sending gift:', error);
      throw error;
    }
  }

  async getUserGifts(telegramId: string): Promise<Gift[]> {
    const giftIds = await this.redis.smembers(`${this.USER_GIFTS_PREFIX}${telegramId}`);
    const gifts: Gift[] = [];

    for (const giftId of giftIds) {
      const giftData = await this.redis.get(`${this.GIFT_PREFIX}${giftId}`);
      if (giftData) {
        gifts.push(JSON.parse(giftData));
      }
    }

    return gifts.sort((a, b) => 
      new Date(b.depositedAt).getTime() - new Date(a.depositedAt).getTime()
    );
  }

  async getPendingWithdrawals(): Promise<(WithdrawalRequest & { gift?: Gift })[]> {
    const withdrawalIds = await this.redis.smembers('pending_withdrawals');
    const withdrawals: (WithdrawalRequest & { gift?: Gift })[] = [];

    for (const withdrawalId of withdrawalIds) {
      const requestData = await this.redis.get(`${this.WITHDRAWAL_PREFIX}${withdrawalId}`);
      if (requestData) {
        const request: WithdrawalRequest = JSON.parse(requestData);
        
        // Get gift details
        const giftData = await this.redis.get(`${this.GIFT_PREFIX}${request.giftId}`);
        if (giftData) {
          request.gift = JSON.parse(giftData);
        }
        
        withdrawals.push(request);
      }
    }

    return withdrawals.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async syncWithTelegram(): Promise<void> {
    // This would sync with Telegram's actual gift data
    // Implementation depends on Telegram's API availability
    console.log('Syncing with Telegram...');
    
    // Notify backend about sync completion
    await this.notifyBackend('sync_completed', { timestamp: new Date().toISOString() });
  }

  private async notifyBackend(event: string, data: any): Promise<void> {
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      
      await fetch(`${backendUrl}/api/webhooks/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data }),
      });
    } catch (error) {
      console.error('Error notifying backend:', error);
    }
  }
}
