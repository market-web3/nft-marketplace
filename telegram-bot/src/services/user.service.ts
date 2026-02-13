/**
 * User Service
 * Manages user data and linking
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';

interface RegisterUserData {
  telegramId: string;
  telegramUsername?: string;
  firstName: string;
  lastName?: string;
}

export class UserService {
  async registerUser(data: RegisterUserData): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/api/telegram/users/register`, {
        telegramId: data.telegramId,
        telegramUsername: data.telegramUsername,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to register user:', error);
      throw error;
    }
  }

  async generateLinkingCode(telegramId: string): Promise<string> {
    try {
      const response = await axios.post(`${API_URL}/api/telegram/users/link-code`, {
        telegramId,
      });
      return response.data.data.code;
    } catch (error) {
      logger.error('Failed to generate linking code:', error);
      // Fallback: generate local code
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  }

  async getInventory(telegramId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/api/telegram/users/inventory`, {
        params: { telegramId },
      });
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get inventory:', error);
      return [];
    }
  }

  async getBalance(telegramId: string): Promise<{ available: number; locked: number }> {
    try {
      const response = await axios.get(`${API_URL}/api/telegram/users/balance`, {
        params: { telegramId },
      });
      return response.data.data || { available: 0, locked: 0 };
    } catch (error) {
      logger.error('Failed to get balance:', error);
      return { available: 0, locked: 0 };
    }
  }

  async getActivity(telegramId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/api/telegram/users/activity`, {
        params: { telegramId },
      });
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get activity:', error);
      return [];
    }
  }
}
