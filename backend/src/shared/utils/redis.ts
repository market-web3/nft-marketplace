/**
 * Redis Manager
 * Handles caching and real-time data with Redis/Valkey
 */

import Redis, { Cluster, RedisOptions } from 'ioredis';
import { config } from '../config/env';
import { logger } from './logger';

export class RedisManager {
  private static instance: Redis | Cluster;
  private static isCluster: boolean = false;

  static async initialize(): Promise<void> {
    const redisUrl = config.REDIS_URL;

    if (config.REDIS_CLUSTER_ENABLED) {
      // Cluster mode for production
      this.instance = new Cluster([{ host: redisUrl, port: 6379 }], {
        redisOptions: {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
        },
      });
      this.isCluster = true;
    } else {
      // Single node mode
      const options: RedisOptions = {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      };

      if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
        this.instance = new Redis(redisUrl, options);
      } else {
        const [host, port] = redisUrl.split(':');
        this.instance = new Redis({
          host,
          port: parseInt(port || '6379', 10),
          ...options,
        });
      }
    }

    // Test connection
    try {
      await this.instance.ping();
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }

    // Setup error handling
    this.instance.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    this.instance.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });
  }

  static getInstance(): Redis | Cluster {
    if (!this.instance) {
      throw new Error('Redis not initialized');
    }
    return this.instance;
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.quit();
      logger.info('Redis connection closed');
    }
  }

  // Cache methods
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.getInstance().get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  static async set(
    key: string,
    value: any,
    ttlSeconds?: number
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.getInstance().setex(key, ttlSeconds, serialized);
      } else {
        await this.getInstance().set(key, serialized);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      await this.getInstance().del(key);
    } catch (error) {
      logger.error('Redis delete error:', error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await this.getInstance().exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  }

  // Hash operations
  static async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.getInstance().hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis hget error:', error);
      return null;
    }
  }

  static async hset(
    key: string,
    field: string,
    value: any
  ): Promise<void> {
    try {
      await this.getInstance().hset(key, field, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis hset error:', error);
    }
  }

  static async hgetall<T>(key: string): Promise<Record<string, T>> {
    try {
      const result = await this.getInstance().hgetall(key);
      const parsed: Record<string, T> = {};
      for (const [field, value] of Object.entries(result)) {
        parsed[field] = JSON.parse(value);
      }
      return parsed;
    } catch (error) {
      logger.error('Redis hgetall error:', error);
      return {};
    }
  }

  // Set operations
  static async sadd(key: string, ...members: string[]): Promise<void> {
    try {
      await this.getInstance().sadd(key, ...members);
    } catch (error) {
      logger.error('Redis sadd error:', error);
    }
  }

  static async srem(key: string, ...members: string[]): Promise<void> {
    try {
      await this.getInstance().srem(key, ...members);
    } catch (error) {
      logger.error('Redis srem error:', error);
    }
  }

  static async smembers(key: string): Promise<string[]> {
    try {
      return await this.getInstance().smembers(key);
    } catch (error) {
      logger.error('Redis smembers error:', error);
      return [];
    }
  }

  // Sorted set operations
  static async zadd(
    key: string,
    score: number,
    member: string
  ): Promise<void> {
    try {
      await this.getInstance().zadd(key, score, member);
    } catch (error) {
      logger.error('Redis zadd error:', error);
    }
  }

  static async zrange(
    key: string,
    start: number,
    stop: number,
    withScores?: boolean
  ): Promise<string[]> {
    try {
      if (withScores) {
        return await this.getInstance().zrange(key, start, stop, 'WITHSCORES');
      }
      return await this.getInstance().zrange(key, start, stop);
    } catch (error) {
      logger.error('Redis zrange error:', error);
      return [];
    }
  }

  static async zrevrange(
    key: string,
    start: number,
    stop: number,
    withScores?: boolean
  ): Promise<string[]> {
    try {
      if (withScores) {
        return await this.getInstance().zrevrange(key, start, stop, 'WITHSCORES');
      }
      return await this.getInstance().zrevrange(key, start, stop);
    } catch (error) {
      logger.error('Redis zrevrange error:', error);
      return [];
    }
  }

  // List operations
  static async lpush(key: string, ...values: string[]): Promise<void> {
    try {
      await this.getInstance().lpush(key, ...values);
    } catch (error) {
      logger.error('Redis lpush error:', error);
    }
  }

  static async rpop(key: string): Promise<string | null> {
    try {
      return await this.getInstance().rpop(key);
    } catch (error) {
      logger.error('Redis rpop error:', error);
      return null;
    }
  }

  static async brpop(key: string, timeout: number): Promise<[string, string] | null> {
    try {
      return await this.getInstance().brpop(timeout, key);
    } catch (error) {
      logger.error('Redis brpop error:', error);
      return null;
    }
  }

  // Pub/Sub
  static async publish(channel: string, message: string): Promise<void> {
    try {
      await this.getInstance().publish(channel, message);
    } catch (error) {
      logger.error('Redis publish error:', error);
    }
  }

  static async subscribe(
    channel: string,
    callback: (message: string) => void
  ): Promise<void> {
    try {
      const subscriber = this.getInstance().duplicate();
      await subscriber.subscribe(channel);
      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          callback(message);
        }
      });
    } catch (error) {
      logger.error('Redis subscribe error:', error);
    }
  }

  // Rate limiting
  static async incrementCounter(
    key: string,
    windowSeconds: number
  ): Promise<number> {
    try {
      const multi = this.getInstance().multi();
      multi.incr(key);
      multi.expire(key, windowSeconds);
      const results = await multi.exec();
      return results?.[0]?.[1] as number;
    } catch (error) {
      logger.error('Redis incrementCounter error:', error);
      return 0;
    }
  }

  // Lock mechanism
  static async acquireLock(
    lockKey: string,
    ttlSeconds: number = 30
  ): Promise<boolean> {
    try {
      const result = await this.getInstance().set(
        lockKey,
        Date.now().toString(),
        'EX',
        ttlSeconds,
        'NX'
      );
      return result === 'OK';
    } catch (error) {
      logger.error('Redis acquireLock error:', error);
      return false;
    }
  }

  static async releaseLock(lockKey: string): Promise<void> {
    try {
      await this.getInstance().del(lockKey);
    } catch (error) {
      logger.error('Redis releaseLock error:', error);
    }
  }

  // Cache keys
  static keys = {
    user: (id: string) => `user:${id}`,
    userByWallet: (address: string) => `user:wallet:${address.toLowerCase()}`,
    nft: (id: string) => `nft:${id}`,
    nftByAddress: (address: string) => `nft:address:${address.toLowerCase()}`,
    listing: (id: string) => `listing:${id}`,
    userInventory: (userId: string) => `inventory:${userId}`,
    category: (id: string) => `category:${id}`,
    stats: {
      volume24h: 'stats:volume:24h',
      totalTrades: 'stats:trades:total',
      activeListings: 'stats:listings:active',
      onlineUsers: 'stats:users:online',
    },
    rateLimit: (key: string) => `ratelimit:${key}`,
    nonce: (address: string) => `nonce:${address.toLowerCase()}`,
    session: (token: string) => `session:${token}`,
    websocket: (userId: string) => `ws:${userId}`,
    transaction: (hash: string) => `tx:${hash}`,
    pendingTx: 'queue:pending:transactions',
    websocketEvents: 'queue:websocket:events',
  };
}
