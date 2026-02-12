/**
 * User Model
 */

import { Knex } from 'knex';

export interface IUser {
  id: string;
  walletAddress: string | null;
  telegramId: string | null;
  telegramUsername: string | null;
  nonce: string;
  isVerified: boolean;
  virtualBalance: string;
  totalVolume: string;
  tradeCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  isBanned: boolean;
  banReason: string | null;
  preferences: IUserPreferences;
}

export interface IUserPreferences {
  notifications: {
    sale: boolean;
    offer: boolean;
    auction: boolean;
    login: boolean;
    deposit: boolean;
    withdraw: boolean;
  };
  language: string;
  currency: string;
}

export const defaultUserPreferences: IUserPreferences = {
  notifications: {
    sale: true,
    offer: true,
    auction: true,
    login: true,
    deposit: true,
    withdraw: true,
  },
  language: 'en',
  currency: 'TON',
};

export class UserModel {
  private static tableName = 'users';

  static async findById(knex: Knex, id: string): Promise<IUser | null> {
    const user = await knex(this.tableName).where({ id }).first();
    return user ? this.parseUser(user) : null;
  }

  static async findByWallet(knex: Knex, walletAddress: string): Promise<IUser | null> {
    const user = await knex(this.tableName)
      .where({ walletAddress: walletAddress.toLowerCase() })
      .first();
    return user ? this.parseUser(user) : null;
  }

  static async findByTelegram(knex: Knex, telegramId: string): Promise<IUser | null> {
    const user = await knex(this.tableName).where({ telegramId }).first();
    return user ? this.parseUser(user) : null;
  }

  static async create(knex: Knex, data: Partial<IUser>): Promise<IUser> {
    const [user] = await knex(this.tableName)
      .insert({
        ...data,
        preferences: JSON.stringify(data.preferences || defaultUserPreferences),
        virtualBalance: '0',
        totalVolume: '0',
        tradeCount: 0,
        isVerified: false,
        isBanned: false,
      })
      .returning('*');
    return this.parseUser(user);
  }

  static async update(knex: Knex, id: string, data: Partial<IUser>): Promise<IUser | null> {
    const updateData: any = { ...data, updatedAt: new Date() };
    
    if (data.preferences) {
      updateData.preferences = JSON.stringify(data.preferences);
    }

    const [user] = await knex(this.tableName)
      .where({ id })
      .update(updateData)
      .returning('*');
    
    return user ? this.parseUser(user) : null;
  }

  static async updateVirtualBalance(
    knex: Knex,
    id: string,
    amount: string,
    operation: 'add' | 'subtract'
  ): Promise<boolean> {
    const result = await knex.raw(
      `
      UPDATE users 
      SET virtual_balance = virtual_balance ${operation === 'add' ? '+' : '-'} ?::numeric,
          updated_at = NOW()
      WHERE id = ?
      RETURNING *
      `,
      [amount, id]
    );
    return result.rowCount > 0;
  }

  static async updateStats(
    knex: Knex,
    id: string,
    volume: string
  ): Promise<boolean> {
    const result = await knex.raw(
      `
      UPDATE users 
      SET total_volume = total_volume + ?::numeric,
          trade_count = trade_count + 1,
          updated_at = NOW()
      WHERE id = ?
      `,
      [volume, id]
    );
    return result.rowCount > 0;
  }

  static async search(
    knex: Knex,
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<IUser[]> {
    const users = await knex(this.tableName)
      .where('walletAddress', 'ilike', `%${query}%`)
      .orWhere('telegramUsername', 'ilike', `%${query}%`)
      .limit(limit)
      .offset(offset)
      .orderBy('createdAt', 'desc');
    
    return users.map(this.parseUser);
  }

  static async getLeaderboard(
    knex: Knex,
    limit: number = 100
  ): Promise<IUser[]> {
    const users = await knex(this.tableName)
      .where('isBanned', false)
      .orderBy('totalVolume', 'desc')
      .limit(limit);
    
    return users.map(this.parseUser);
  }

  private static parseUser(row: any): IUser {
    return {
      id: row.id,
      walletAddress: row.wallet_address,
      telegramId: row.telegram_id,
      telegramUsername: row.telegram_username,
      nonce: row.nonce,
      isVerified: row.is_verified,
      virtualBalance: row.virtual_balance,
      totalVolume: row.total_volume,
      tradeCount: row.trade_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
      isBanned: row.is_banned,
      banReason: row.ban_reason,
      preferences: typeof row.preferences === 'string' 
        ? JSON.parse(row.preferences) 
        : row.preferences,
    };
  }
}
