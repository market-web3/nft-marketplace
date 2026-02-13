/**
 * Blockchain Sync Processor
 * Syncs data with TON blockchain
 */

import { Job } from 'bullmq';
import { TonClient } from '@ton/ton';
import { logger } from '../../shared/utils/logger';
import { DatabaseManager } from '../../shared/utils/database';
import { config } from '../../shared/config/env';

interface BlockchainJob {
  action: 'sync-blocks' | 'check-auctions' | 'verify-pending';
}

let lastProcessedLt: string | null = null;

export async function syncBlockchain(job: Job<BlockchainJob>): Promise<void> {
  const { action } = job.data;

  logger.debug({ jobId: job.id, action }, 'Processing blockchain job');

  const db = DatabaseManager.getInstance();

  try {
    switch (action) {
      case 'sync-blocks':
        await syncNewBlocks(db);
        break;
      case 'check-auctions':
        await checkEndingAuctions(db);
        break;
      case 'verify-pending':
        await verifyPendingTransactions(db);
        break;
    }
  } catch (error) {
    logger.error({
      jobId: job.id,
      action,
      error: (error as Error).message,
    }, 'Blockchain sync failed');
    throw error;
  }
}

async function syncNewBlocks(db: any): Promise<void> {
  if (!config.TON_CONTRACT_ADDRESS) {
    logger.debug('No contract address configured, skipping block sync');
    return;
  }

  try {
    const client = new TonClient({
      endpoint: config.TON_API_ENDPOINT,
      apiKey: config.TON_API_KEY,
    });

    // Get transactions for marketplace contract
    const transactions = await client.getTransactions(config.TON_CONTRACT_ADDRESS, {
      limit: 50,
      ...(lastProcessedLt && { lt: lastProcessedLt }),
    });

    for (const tx of transactions) {
      // Process each transaction
      await processBlockchainTransaction(db, tx);
      
      if (tx.lt) {
        lastProcessedLt = tx.lt;
      }
    }

    if (transactions.length > 0) {
      logger.debug(`Synced ${transactions.length} transactions`);
    }

  } catch (error) {
    logger.error('Failed to sync blocks:', error);
  }
}

async function processBlockchainTransaction(db: any, tx: any): Promise<void> {
  try {
    // Check if transaction already processed
    const existing = await db('transactions')
      .where('blockchain_hash', tx.hash)
      .first();

    if (existing) {
      return;
    }

    // Parse transaction based on type
    const inMsg = tx.inMessage;
    if (!inMsg) return;

    const value = inMsg.value?.toString();
    const sender = inMsg.source?.toString();
    const body = inMsg.body;

    // Detect transaction type from message body
    // This is simplified - real implementation would parse the specific op codes
    if (body) {
      // Store raw transaction for processing
      await db('raw_blockchain_transactions').insert({
        hash: tx.hash,
        lt: tx.lt,
        sender,
        value,
        body: body.toBoc().toString('base64'),
        processed: false,
        created_at: new Date(tx.now * 1000),
      });
    }

  } catch (error) {
    logger.error(`Failed to process transaction ${tx.hash}:`, error);
  }
}

async function checkEndingAuctions(db: any): Promise<void> {
  const endingAuctions = await db('auctions')
    .select('id')
    .where('status', 'active')
    .where('ends_at', '<=', db.raw('NOW() + INTERVAL \'5 minutes\''))
    .where('notified_ending', false);

  for (const auction of endingAuctions) {
    // Queue notification job
    const { WorkerManager } = await import('../manager');
    const manager = new WorkerManager();
    await manager.addJob('auctions', 'notify-ending', {
      auctionId: auction.id,
      action: 'notify',
    });

    // Mark as notified
    await db('auctions')
      .where('id', auction.id)
      .update({ notified_ending: true });
  }

  // Find auctions that have ended
  const endedAuctions = await db('auctions')
    .select('id')
    .where('status', 'active')
    .where('ends_at', '<=', db.raw('NOW()'));

  for (const auction of endedAuctions) {
    // Queue end auction job
    const { WorkerManager } = await import('../manager');
    const manager = new WorkerManager();
    await manager.addJob('auctions', 'end-auction', {
      auctionId: auction.id,
      action: 'end',
    });
  }

  if (endingAuctions.length > 0 || endedAuctions.length > 0) {
    logger.debug({
      endingCount: endingAuctions.length,
      endedCount: endedAuctions.length,
    }, 'Processed auction checks');
  }
}

async function verifyPendingTransactions(db: any): Promise<void> {
  const pendingTxs = await db('transactions')
    .select('*')
    .where('status', 'pending')
    .where('created_at', '<', db.raw('NOW() - INTERVAL \'10 minutes\''))
    .limit(100);

  for (const tx of pendingTxs) {
    try {
      const client = new TonClient({
        endpoint: config.TON_API_ENDPOINT,
        apiKey: config.TON_API_KEY,
      });

      // Verify on blockchain
      const blockchainTx = await client.getTransaction(tx.hash);
      
      if (blockchainTx) {
        // Transaction confirmed
        await db('transactions')
          .where('id', tx.id)
          .update({
            status: 'completed',
            confirmed_at: new Date(),
          });

        logger.info({ txId: tx.id, hash: tx.hash }, 'Pending transaction confirmed');
      } else {
        // Check if too old
        const age = Date.now() - new Date(tx.created_at).getTime();
        if (age > 3600000) { // 1 hour
          await db('transactions')
            .where('id', tx.id)
            .update({
              status: 'failed',
              error: 'Transaction not found on blockchain after 1 hour',
            });

          logger.warn({ txId: tx.id, hash: tx.hash }, 'Pending transaction marked as failed');
        }
      }
    } catch (error) {
      logger.error({ txId: tx.id, error: (error as Error).message }, 'Failed to verify transaction');
    }
  }
}
