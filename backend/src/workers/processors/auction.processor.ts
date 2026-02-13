/**
 * Auction Processor
 * Handles auction end processing
 */

import { Job } from 'bullmq';
import { logger } from '../../shared/utils/logger';
import { DatabaseManager } from '../../shared/utils/database';
import { RedisManager } from '../../shared/utils/redis';

interface AuctionJob {
  auctionId: string;
  action: 'end' | 'extend' | 'notify';
}

export async function processAuctionEnd(job: Job<AuctionJob>): Promise<void> {
  const { auctionId, action } = job.data;

  logger.info({
    jobId: job.id,
    auctionId,
    action,
  }, 'Processing auction job');

  const db = DatabaseManager.getInstance();

  try {
    switch (action) {
      case 'end':
        await endAuction(db, auctionId);
        break;
      case 'extend':
        await extendAuction(db, auctionId);
        break;
      case 'notify':
        await notifyAuctionEnding(db, auctionId);
        break;
    }
  } catch (error) {
    logger.error({
      jobId: job.id,
      auctionId,
      action,
      error: (error as Error).message,
    }, 'Auction processing failed');
    throw error;
  }
}

async function endAuction(db: any, auctionId: string): Promise<void> {
  const auction = await db('auctions')
    .select(
      'auctions.*',
      'listings.nft_id',
      'listings.seller_id',
      'nfts.name as nft_name'
    )
    .leftJoin('listings', 'auctions.listing_id', 'listings.id')
    .leftJoin('nfts', 'listings.nft_id', 'nfts.id')
    .where('auctions.id', auctionId)
    .first();

  if (!auction || auction.status !== 'active') {
    logger.warn(`Auction ${auctionId} not found or not active`);
    return;
  }

  await db.transaction(async (trx: any) => {
    if (auction.highest_bidder_id && auction.highest_bid > auction.reserve_price) {
      // Auction won - transfer NFT
      await trx('nfts')
        .where('id', auction.nft_id)
        .update({
          owner_id: auction.highest_bidder_id,
          status: 'active',
        });

      // Update listing
      await trx('listings')
        .where('id', auction.listing_id)
        .update({
          status: 'sold',
          sold_at: new Date(),
          final_price: auction.highest_bid,
        });

      // Create sale transaction
      await trx('transactions').insert({
        type: 'sale',
        nft_id: auction.nft_id,
        from_user_id: auction.seller_id,
        to_user_id: auction.highest_bidder_id,
        amount: auction.highest_bid,
        status: 'pending',
      });

      // Update auction
      await trx('auctions')
        .where('id', auctionId)
        .update({
          status: 'completed',
          ended_at: new Date(),
        });

      // Notify winner
      await trx('notifications').insert({
        user_id: auction.highest_bidder_id,
        type: 'auction_won',
        title: 'Auction Won!',
        message: `Congratulations! You won the auction for "${auction.nft_name}"`,
        channels: JSON.stringify(['in_app', 'telegram']),
      });

      // Notify seller
      await trx('notifications').insert({
        user_id: auction.seller_id,
        type: 'auction_ended',
        title: 'Auction Ended',
        message: `Your auction for "${auction.nft_name}" has ended with a winning bid of ${auction.highest_bid} TON`,
        channels: JSON.stringify(['in_app', 'telegram']),
      });

      logger.info({
        auctionId,
        winnerId: auction.highest_bidder_id,
        finalPrice: auction.highest_bid,
      }, 'Auction completed with winner');

    } else {
      // No winner - return NFT to seller
      await trx('listings')
        .where('id', auction.listing_id)
        .update({
          status: 'expired',
        });

      await trx('auctions')
        .where('id', auctionId)
        .update({
          status: 'expired',
          ended_at: new Date(),
        });

      // Notify seller
      await trx('notifications').insert({
        user_id: auction.seller_id,
        type: 'auction_expired',
        title: 'Auction Expired',
        message: `Your auction for "${auction.nft_name}" has expired with no winning bids`,
        channels: JSON.stringify(['in_app']),
      });

      logger.info({ auctionId }, 'Auction expired with no winner');
    }
  });

  // Broadcast event
  await RedisManager.publish('marketplace:events', JSON.stringify({
    type: 'auction:end',
    data: {
      auctionId,
      winnerId: auction.highest_bidder_id,
      finalPrice: auction.highest_bid,
    },
  }));
}

async function extendAuction(db: any, auctionId: string): Promise<void> {
  const auction = await db('auctions')
    .where('id', auctionId)
    .first();

  if (!auction || auction.status !== 'active') {
    return;
  }

  // Extend by 5 minutes if bid in last 5 minutes
  const newEndTime = new Date(Date.now() + 5 * 60 * 1000);

  await db('auctions')
    .where('id', auctionId)
    .update({
      ends_at: newEndTime,
    });

  logger.info({ auctionId, newEndTime }, 'Auction extended');
}

async function notifyAuctionEnding(db: any, auctionId: string): Promise<void> {
  const auction = await db('auctions')
    .select('auctions.*', 'nfts.name as nft_name')
    .leftJoin('listings', 'auctions.listing_id', 'listings.id')
    .leftJoin('nfts', 'listings.nft_id', 'nfts.id')
    .where('auctions.id', auctionId)
    .first();

  if (!auction || auction.status !== 'active') {
    return;
  }

  // Notify bidders
  const bidders = await db('bids')
    .distinct('user_id')
    .where('auction_id', auctionId);

  for (const bidder of bidders) {
    await db('notifications').insert({
      user_id: bidder.user_id,
      type: 'auction_ending',
      title: 'Auction Ending Soon',
      message: `The auction for "${auction.nft_name}" is ending soon!`,
      channels: JSON.stringify(['in_app', 'telegram']),
    });
  }

  logger.info({ auctionId, bidderCount: bidders.length }, 'Auction ending notifications sent');
}
