/**
 * User Model
 */

import { DatabaseManager } from '../utils/database';
import { logger } from '../utils/logger';

export interface CreateUserData {
  walletAddress: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  telegramId?: string;
  telegramUsername?: string;
}

export interface UpdateUserData {
  username?: string;
  avatarUrl?: string;
  bio?: string;
}

export class UserModel {
  static async create(data: CreateUserData): Promise<any> {
    const db = DatabaseManager.getInstance();
    
    try {
      const [user] = await db('users')
        .insert({
          wallet_address: data.walletAddress,
          username: data.username,
          avatar_url: data.avatarUrl,
          bio: data.bio,
          telegram_id: data.telegramId,
          telegram_username: data.telegramUsername,
        })
        .returning('*');
      
      return user;
    } catch (error) {
      logger.error('Failed to create user:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<any | null> {
    const db = DatabaseManager.getInstance();
    
    const user = await db('users')
      .select('*')
      .where('id', id)
      .first();
    
    return user || null;
  }

  static async findByWallet(walletAddress: string): Promise<any | null> {
    const db = DatabaseManager.getInstance();
    
    const user = await db('users')
      .select('*')
      .where('wallet_address', walletAddress)
      .first();
    
    return user || null;
  }

  static async findByTelegramId(telegramId: string): Promise<any | null> {
    const db = DatabaseManager.getInstance();
    
    const user = await db('users')
      .select('*')
      .where('telegram_id', telegramId)
      .first();
    
    return user || null;
  }

  static async update(id: string, data: UpdateUserData): Promise<any> {
    const db = DatabaseManager.getInstance();
    
    const [user] = await db('users')
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning('*');
    
    return user;
  }

  static async linkTelegram(id: string, data: { telegramId: string; telegramUsername?: string }): Promise<any> {
    const db = DatabaseManager.getInstance();
    
    const [user] = await db('users')
      .where('id', id)
      .update({
        telegram_id: data.telegramId,
        telegram_username: data.telegramUsername,
        updated_at: new Date(),
      })
      .returning('*');
    
    return user;
  }

  static async updateLastActive(id: string): Promise<void> {
    const db = DatabaseManager.getInstance();
    
    await db('users')
      .where('id', id)
      .update({
        last_active: new Date(),
      });
  }

  static async getStats(id: string): Promise<any> {
    const db = DatabaseManager.getInstance();
    
    const [
      ownedNfts,
      createdNfts,
      totalSales,
      totalVolume,
    ] = await Promise.all([
      db('nfts').where('owner_id', id).count('* as count').first(),
      db('nfts').where('creator_id', id).count('* as count').first(),
      db('transactions').where('from_user_id', id).where('type', 'sale').count('* as count').first(),
      db('transactions').where('from_user_id', id).where('type', 'sale').sum('amount as total').first(),
    ]);

    return {
      ownedNfts: parseInt(ownedNfts?.count as string) || 0,
      createdNfts: parseInt(createdNfts?.count as string) || 0,
      totalSales: parseInt(totalSales?.count as string) || 0,
      totalVolume: totalVolume?.total || 0,
    };
  }

  static async getInventory(id: string, page: number = 1, limit: number = 20): Promise<any> {
    const db = DatabaseManager.getInstance();
    const offset = (page - 1) * limit;
    
    const nfts = await db('nfts')
      .select(
        'nfts.*',
        'categories.name as category_name',
        'listings.price',
        'listings.status as listing_status'
      )
      .leftJoin('categories', 'nfts.category_id', 'categories.id')
      .leftJoin('listings', 'nfts.id', 'listings.nft_id')
      .where('nfts.owner_id', id)
      .orderBy('nfts.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db('nfts')
      .where('owner_id', id)
      .count('* as count');

    return {
      items: nfts,
      pagination: {
        page,
        limit,
        total: parseInt(count as string),
        totalPages: Math.ceil(parseInt(count as string) / limit),
      },
    };
  }

  static async getActivity(id: string, page: number = 1, limit: number = 20): Promise<any> {
    const db = DatabaseManager.getInstance();
    const offset = (page - 1) * limit;
    
    const activities = await db('activity_log')
      .select('*')
      .where('user_id', id)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db('activity_log')
      .where('user_id', id)
      .count('* as count');

    return {
      items: activities,
      pagination: {
        page,
        limit,
        total: parseInt(count as string),
        totalPages: Math.ceil(parseInt(count as string) / limit),
      },
    };
  }
}
