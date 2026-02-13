/**
 * Worker Manager
 * Manages background job processing
 */

import { Queue, Worker, Job } from 'bullmq';
import { config } from '../shared/config/env';
import { logger } from '../shared/utils/logger';
import { RedisManager } from '../shared/utils/redis';
import { TransactionWorker } from './transaction.worker';
import { NotificationWorker } from './notification.worker';
import { AuctionWorker } from './auction.worker';

export class WorkerManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private isRunning: boolean = false;

  async start(): Promise<void> {
    if (this.isRunning) return;

    logger.info('Starting Worker Manager...');

    // Initialize queues
    this.initializeQueues();

    // Initialize workers
    await this.initializeWorkers();

    this.isRunning = true;
    logger.info('Worker Manager started successfully');
  }

  private initializeQueues(): void {
    const redisConnection = RedisManager.getInstance();

    // Transaction processing queue
    this.queues.set('transactions', new Queue('transactions', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }));

    // Notification queue
    this.queues.set('notifications', new Queue('notifications', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    }));

    // Auction queue
    this.queues.set('auctions', new Queue('auctions', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
      },
    }));

    // Gift processing queue
    this.queues.set('gifts', new Queue('gifts', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
      },
    }));
  }

  private async initializeWorkers(): Promise<void> {
    const redisConnection = RedisManager.getInstance();

    // Transaction worker
    const transactionWorker = new TransactionWorker();
    this.workers.set('transactions', new Worker('transactions', 
      async (job: Job) => transactionWorker.process(job),
      { connection: redisConnection }
    ));

    // Notification worker
    const notificationWorker = new NotificationWorker();
    this.workers.set('notifications', new Worker('notifications',
      async (job: Job) => notificationWorker.process(job),
      { connection: redisConnection }
    ));

    // Auction worker
    const auctionWorker = new AuctionWorker();
    this.workers.set('auctions', new Worker('auctions',
      async (job: Job) => auctionWorker.process(job),
      { connection: redisConnection }
    ));

    // Setup error handlers
    this.workers.forEach((worker, name) => {
      worker.on('failed', (job, err) => {
        logger.error(`Worker ${name} failed for job ${job?.id}:`, err);
      });

      worker.on('completed', (job) => {
        logger.debug(`Worker ${name} completed job ${job.id}`);
      });
    });
  }

  async addJob(queueName: string, jobName: string, data: any, opts?: any): Promise<Job> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    return queue.add(jobName, data, opts);
  }

  async stop(): Promise<void> {
    logger.info('Stopping Worker Manager...');

    // Close all workers
    for (const [name, worker] of this.workers) {
      await worker.close();
      logger.info(`Worker ${name} stopped`);
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info(`Queue ${name} closed`);
    }

    this.isRunning = false;
    logger.info('Worker Manager stopped');
  }
}
