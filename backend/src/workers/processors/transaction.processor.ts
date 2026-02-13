/**
 * Transaction Processor
 * Processes blockchain transactions
 */

import { Job } from 'bullmq';
import { logger } from '../../shared/utils/logger';
import { DatabaseManager } from '../../shared/utils/database';
import { RedisManager } from '../../shared/utils/redis';
import { TonClient } from '@ton/ton';
import { config } from '../../shared/config/env';

interface TransactionJob {
  hash: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'offer';
  nftId?: string;
  fromUserId?: string;
  toUserId?: string;
  amount: number;
}

export async function processTransaction(job: Job<TransactionJob>): Promise<void> {
  const { hash, type, nftId, fromUserId, toUserId, amount } = job.data;
  
  logger.info({
    jobId: job.id,
    hash,
    type,
  }, 'Processing transaction');

  const db = DatabaseManager.getInstance();

  try {
    // Verify transaction on blockchain
    const isConfirmed = await verifyTransaction(hash);
    
    if (!isConfirmed) {
      throw new Error(`Transaction ${hash} not confirmed`);
    }

    await db.transaction(async (trx) => {
      // Update transaction status
      await trx('transactions')
        .where('hash', hash)
        .update({
          status: 'completed',
          confirmed_at: new Date(),
        });

      // Update related records based on transaction type
      switch (type) {
        case 'deposit':
          if (nftId) {
            await trx('nfts')
              .where('id', nftId)
              .update({
                status: 'deposited',
                deposit_tx_hash: hash,
              });
          }
          break;

        case 'purchase':
          if (nftId && toUserId) {
            // Transfer NFT ownership
            await trx('nfts')
              .where('id', nftId)
              .update({
                owner_id: toUserId,
                status: 'active',
              });

            // Close listing
            await trx('listings')
              .where('nft_id', nftId)
              .where('status', 'active')
              .update({
                status: 'sold',
                sold_at: new Date(),
              });
          }
          break;

        case 'sale':
          // Update seller's balance
          if (fromUserId) {
            await trx('users')
              .where('id', fromUserId)
              .increment('total_sales', 1)
              .increment('total_volume', amount);
          }
          break;

        case 'offer':
          // Update offer status
          await trx('offers')
            .where('transaction_hash', hash)
            .update({
              status: 'active',
            });
          break;
      }
    });

    // Publish event for real-time updates
    await RedisManager.publish('marketplace:events', JSON.stringify({
      type: `transaction:${type}`,
      data: {
        hash,
        nftId,
        fromUserId,
        toUserId,
        amount,
      },
    }));

    logger.info({
      jobId: job.id,
      hash,
      type,
    }, 'Transaction processed successfully');

  } catch (error) {
    logger.error({
      jobId: job.id,
      hash,
      error: (error as Error).message,
    }, 'Transaction processing failed');

    // Update transaction as failed
    await db('transactions')
      .where('hash', hash)
      .update({
        status: 'failed',
        error: (error as Error).message,
      });

    throw error;
  }
}

async function verifyTransaction(hash: string): Promise<boolean> {
  try {
    const client = new TonClient({
      endpoint: config.TON_API_ENDPOINT,
      apiKey: config.TON_API_KEY,
    });

    // Get transaction info from TON
    const transaction = await client.getTransaction(hash);
    
    if (!transaction) {
      return false;
    }

    // Check confirmations (wait for at least 1 confirmation)
    return transaction.inMessage !== undefined;
  } catch (error) {
    logger.error(`Failed to verify transaction ${hash}:`, error);
    return false;
  }
}
