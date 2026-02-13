/**
 * Gift Service
 * Manages Telegram gifts in the marketplace
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export class GiftService {
  async getUserGifts(telegramId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/api/telegram/gifts`, {
        params: { telegramId },
      });
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get user gifts:', error);
      return [];
    }
  }

  async depositGift(telegramId: string, giftId: string): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/api/telegram/gifts/deposit`, {
        telegramId,
        giftId,
      });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to deposit gift:', error);
      throw error;
    }
  }

  async withdrawGift(telegramId: string, giftId: string, toUserId: string): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/api/telegram/gifts/withdraw`, {
        telegramId,
        giftId,
        toUserId,
      });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to withdraw gift:', error);
      throw error;
    }
  }

  async syncGifts(telegramId: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/api/telegram/gifts/sync`, {
        telegramId,
      });
    } catch (error) {
      logger.error('Failed to sync gifts:', error);
    }
  }
}
