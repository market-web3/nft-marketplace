/**
 * Worker Manager
 * Manages background job processing
 */

import { Queue, Worker, Job } from 'bullmq';
import { RedisManager } from '../shared/utils/redis';
import { logger } from '../shared/utils/logger';
import { config } from '../shared/config/env';

// Job processors
import { processTransaction } from './processors/transaction.processor';
import { processNotification } from './processors/notification.processor';
import { processAuctionEnd } from './processors/auction.processor';
import { syncBlockchain } from './processors/blockchain.processor';

export class WorkerManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private isRunning: boolean = false;

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker manager already running');
      return;
    }

    logger.info('Starting worker manager...');

    // Initialize queues
    this.initializeQueue('transactions', processTransaction);
    this.initializeQueue('notifications', processNotification);
    this.initializeQueue('auctions', processAuctionEnd);
    this.initializeQueue('blockchain-sync', syncBlockchain);

    // Schedule recurring jobs
    await this.scheduleRecurringJobs();

    this.isRunning = true;
    logger.info('Worker manager started successfully');
  }

  private initializeQueue(name: string, processor: (job: Job) => Promise<any>): void {
    const queue = new Queue(name, {
      connection: RedisManager.getInstance(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    const worker = new Worker(name, processor, {
      connection: RedisManager.getInstance(),
      concurrency: 5,
    });

    worker.on('completed', (job) => {
      logger.debug(`Job ${job.id} completed in queue ${name}`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed in queue ${name}:`, err);
    });

    this.queues.set(name, queue);
    this.workers.set(name, worker);

    logger.info(`Queue '${name}' initialized`);
  }

  private async scheduleRecurringJobs(): Promise<void> {
    const blockchainQueue = this.queues.get('blockchain-sync');
    
    if (blockchainQueue) {
      // Schedule blockchain sync every 30 seconds
      await blockchainQueue.add('sync-blocks', {}, {
        repeat: {
          every: 30000,
        },
      });

      // Schedule auction check every minute
      await blockchainQueue.add('check-auctions', {}, {
        repeat: {
          every: 60000,
        },
      });
    }
  }

  async addJob(queueName: string, jobName: string, data: any, options?: any): Promise<Job> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    return queue.add(jobName, data, options);
  }

  async stop(): Promise<void> {
    logger.info('Stopping worker manager...');

    // Close all workers
    for (const [name, worker] of this.workers) {
      await worker.close();
      logger.info(`Worker '${name}' stopped`);
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info(`Queue '${name}' closed`);
    }

    this.isRunning = false;
    logger.info('Worker manager stopped');
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [name, queue] of this.queues) {
      stats[name] = {
        waiting: queue.getWaitingCount(),
        active: queue.getActiveCount(),
        completed: queue.getCompletedCount(),
        failed: queue.getFailedCount(),
      };
    }
    
    return stats;
  }
}
