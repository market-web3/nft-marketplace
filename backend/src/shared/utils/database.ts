/**
 * Database Manager
 * Handles PostgreSQL connections with connection pooling
 */

import knex, { Knex } from 'knex';
import { config } from '../config/env';
import { logger } from './logger';

export class DatabaseManager {
  private static instance: Knex;
  private static readReplica: Knex | null = null;

  static async initialize(): Promise<void> {
    const knexConfig: Knex.Config = {
      client: 'pg',
      connection: config.DATABASE_URL,
      pool: {
        min: 5,
        max: parseInt(config.DATABASE_POOL_SIZE as unknown as string, 10) || 20,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
      },
      migrations: {
        directory: './database/migrations',
        tableName: 'knex_migrations',
      },
      seeds: {
        directory: './database/seeds',
      },
      debug: config.NODE_ENV === 'development',
      asyncStackTraces: config.NODE_ENV === 'development',
    };

    this.instance = knex(knexConfig);

    // Test connection
    try {
      await this.instance.raw('SELECT 1');
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }

    // Setup read replica if configured
    const readReplicaUrl = process.env.DATABASE_READ_REPLICA_URL;
    if (readReplicaUrl) {
      this.readReplica = knex({
        ...knexConfig,
        connection: readReplicaUrl,
      });
      logger.info('Read replica connection established');
    }
  }

  static getInstance(): Knex {
    if (!this.instance) {
      throw new Error('Database not initialized');
    }
    return this.instance;
  }

  static getReadReplica(): Knex {
    if (this.readReplica) {
      return this.readReplica;
    }
    return this.getInstance();
  }

  static async transaction<T>(
    callback: (trx: Knex.Transaction) => Promise<T>
  ): Promise<T> {
    return this.getInstance().transaction(callback);
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.destroy();
      logger.info('Database connection closed');
    }
    if (this.readReplica) {
      await this.readReplica.destroy();
      logger.info('Read replica connection closed');
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      await this.getInstance().raw('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  static async getStats(): Promise<{
    total: number;
    idle: number;
    used: number;
    waiting: number;
  }> {
    const pool = this.getInstance().context.client.pool;
    return {
      total: pool.numUsed() + pool.numFree(),
      idle: pool.numFree(),
      used: pool.numUsed(),
      waiting: pool.numPendingAcquires(),
    };
  }
}

// Export knex instance for convenience
export const db = DatabaseManager.getInstance.bind(DatabaseManager);
