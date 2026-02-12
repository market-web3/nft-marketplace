/**
 * Transaction Model
 * Tracks all on-chain and off-chain transactions
 */

import { Knex } from 'knex';

export interface ITransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  fromAddress: string | null;
  toAddress: string | null;
  fromUserId: string | null;
  toUserId: string | null;
  amount: string | null;
  tokenAddress: string | null;
  nftId: string | null;
  listingId: string | null;
  hash: string | null;
  lt: string | null;
  blockSeqno: number | null;
  confirmations: number;
  fee: string | null;
  gasUsed: string | null;
  exitCode: number | null;
  message: string | null;
  payload: Record<string, any> | null;
  retryCount: number;
  maxRetries: number;
  processedAt: Date | null;
  confirmedAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType =
  | 'deposit_nft'
  | 'withdraw_nft'
  | 'deposit_ton'
  | 'withdraw_ton'
  | 'virtual_deposit'
  | 'virtual_withdraw'
  | 'sale'
  | 'purchase'
  | 'bid'
  | 'refund'
  | 'royalty'
  | 'fee'
  | 'gift_send'
  | 'gift_receive'
  | 'batch_operation'
  | 'highload_execute'
  | 'offer_create'
  | 'offer_accept';

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export interface IHashComment {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw';
  hash: string;
  amount: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  usedForTransactionId: string | null;
  createdAt: Date;
}

export class TransactionModel {
  private static tableName = 'transactions';
  private static hashCommentsTable = 'hash_comments';

  static async create(
    knex: Knex,
    data: Partial<ITransaction>
  ): Promise<ITransaction> {
    const [transaction] = await knex(this.tableName)
      .insert({
        ...data,
        status: data.status || 'pending',
        retryCount: 0,
        maxRetries: data.maxRetries || 3,
        confirmations: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning('*');
    return this.parseTransaction(transaction);
  }

  static async findById(knex: Knex, id: string): Promise<ITransaction | null> {
    const tx = await knex(this.tableName).where({ id }).first();
    return tx ? this.parseTransaction(tx) : null;
  }

  static async findByHash(knex: Knex, hash: string): Promise<ITransaction | null> {
    const tx = await knex(this.tableName).where({ hash }).first();
    return tx ? this.parseTransaction(tx) : null;
  }

  static async findByLt(knex: Knex, lt: string): Promise<ITransaction | null> {
    const tx = await knex(this.tableName).where({ lt }).first();
    return tx ? this.parseTransaction(tx) : null;
  }

  static async getPendingTransactions(
    knex: Knex,
    type?: TransactionType,
    limit: number = 100
  ): Promise<ITransaction[]> {
    let query = knex(this.tableName)
      .whereIn('status', ['pending', 'processing', 'retrying'])
      .andWhere('retryCount', '<', knex.raw('max_retries'))
      .orderBy('createdAt', 'asc')
      .limit(limit);

    if (type) {
      query = query.where({ type });
    }

    const txs = await query;
    return txs.map(this.parseTransaction);
  }

  static async updateStatus(
    knex: Knex,
    id: string,
    status: TransactionStatus,
    data?: Partial<ITransaction>
  ): Promise<boolean> {
    const update: any = { status, updatedAt: new Date() };

    if (status === 'confirmed') {
      update.confirmedAt = new Date();
      update.processedAt = new Date();
    } else if (status === 'failed') {
      update.failedAt = new Date();
    } else if (status === 'processing') {
      update.processedAt = new Date();
    }

    if (data) {
      Object.assign(update, data);
    }

    const result = await knex(this.tableName)
      .where({ id })
      .update(update);
    return result > 0;
  }

  static async incrementRetry(knex: Knex, id: string): Promise<boolean> {
    const result = await knex(this.tableName)
      .where({ id })
      .update({
        retryCount: knex.raw('retry_count + 1'),
        status: 'retrying',
        updatedAt: new Date(),
      });
    return result > 0;
  }

  static async addConfirmation(
    knex: Knex,
    id: string,
    blockSeqno: number
  ): Promise<boolean> {
    const result = await knex(this.tableName)
      .where({ id })
      .update({
        confirmations: knex.raw('confirmations + 1'),
        blockSeqno,
        updatedAt: new Date(),
      });
    return result > 0;
  }

  static async getTransactionsByUser(
    knex: Knex,
    userId: string,
    filters?: {
      type?: TransactionType;
      status?: TransactionStatus;
    },
    pagination?: { limit: number; offset: number }
  ): Promise<{ items: ITransaction[]; total: number }> {
    let query = knex(this.tableName).where(function() {
      this.where({ fromUserId: userId }).orWhere({ toUserId: userId });
    });

    if (filters?.type) {
      query = query.where({ type: filters.type });
    }
    if (filters?.status) {
      query = query.where({ status: filters.status });
    }

    const totalQuery = query.clone();
    const total = await totalQuery.count('id as count').first();

    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }

    query = query.orderBy('createdAt', 'desc');
    const txs = await query;

    return {
      items: txs.map(this.parseTransaction),
      total: parseInt(total?.count as string, 10) || 0,
    };
  }

  static async getTransactionsByNft(
    knex: Knex,
    nftId: string,
    pagination?: { limit: number; offset: number }
  ): Promise<{ items: ITransaction[]; total: number }> {
    let query = knex(this.tableName).where({ nftId });

    const totalQuery = query.clone();
    const total = await totalQuery.count('id as count').first();

    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }

    query = query.orderBy('createdAt', 'desc');
    const txs = await query;

    return {
      items: txs.map(this.parseTransaction),
      total: parseInt(total?.count as string, 10) || 0,
    };
  }

  // Hash comment methods
  static async createHashComment(
    knex: Knex,
    data: Partial<IHashComment>
  ): Promise<IHashComment> {
    const [comment] = await knex(this.hashCommentsTable)
      .insert({
        ...data,
        createdAt: new Date(),
      })
      .returning('*');
    return this.parseHashComment(comment);
  }

  static async findHashComment(
    knex: Knex,
    hash: string
  ): Promise<IHashComment | null> {
    const comment = await knex(this.hashCommentsTable)
      .where({ hash })
      .andWhere('expiresAt', '>', new Date())
      .first();
    return comment ? this.parseHashComment(comment) : null;
  }

  static async markHashUsed(
    knex: Knex,
    hash: string,
    transactionId: string
  ): Promise<boolean> {
    const result = await knex(this.hashCommentsTable)
      .where({ hash, usedAt: null })
      .update({
        usedAt: new Date(),
        usedForTransactionId: transactionId,
      });
    return result > 0;
  }

  static async cleanupExpiredHashComments(knex: Knex): Promise<number> {
    const result = await knex(this.hashCommentsTable)
      .where('expiresAt', '<=', new Date())
      .whereNull('usedAt')
      .delete();
    return result;
  }

  // Statistics
  static async getVolumeStats(
    knex: Knex,
    period: '1h' | '24h' | '7d' | '30d' | 'all'
  ): Promise<{
    totalVolume: string;
    totalTransactions: number;
    totalFees: string;
  }> {
    let query = knex(this.tableName).where({ status: 'confirmed' });

    if (period !== 'all') {
      const interval =
        period === '1h'
          ? '1 hour'
          : period === '24h'
          ? '24 hours'
          : period === '7d'
          ? '7 days'
          : '30 days';
      query = query.whereRaw(`created_at > NOW() - INTERVAL '${interval}'`);
    }

    const result = await query
      .sum({ totalVolume: 'amount' })
      .count({ totalTransactions: 'id' })
      .sum({ totalFees: 'fee' })
      .first();

    return {
      totalVolume: (result?.totalVolume as string) || '0',
      totalTransactions: parseInt(result?.totalTransactions as string, 10) || 0,
      totalFees: (result?.totalFees as string) || '0',
    };
  }

  static async getPendingCount(knex: Knex): Promise<number> {
    const result = await knex(this.tableName)
      .whereIn('status', ['pending', 'processing'])
      .count('id as count')
      .first();
    return parseInt(result?.count as string, 10) || 0;
  }

  // Parsers
  private static parseTransaction(row: any): ITransaction {
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      fromAddress: row.from_address,
      toAddress: row.to_address,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      amount: row.amount,
      tokenAddress: row.token_address,
      nftId: row.nft_id,
      listingId: row.listing_id,
      hash: row.hash,
      lt: row.lt,
      blockSeqno: row.block_seqno,
      confirmations: row.confirmations,
      fee: row.fee,
      gasUsed: row.gas_used,
      exitCode: row.exit_code,
      message: row.message,
      payload:
        typeof row.payload === 'string'
          ? JSON.parse(row.payload)
          : row.payload,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      processedAt: row.processed_at,
      confirmedAt: row.confirmed_at,
      failedAt: row.failed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static parseHashComment(row: any): IHashComment {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      hash: row.hash,
      amount: row.amount,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      usedForTransactionId: row.used_for_transaction_id,
      createdAt: row.created_at,
    };
  }
}
