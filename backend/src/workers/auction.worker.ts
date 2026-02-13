/**
 * Auction Worker
 * Handles auction-related background tasks
 */

import { Job } from 'bullmq';
import { logger } from '../shared/utils/logger';
import { DatabaseManager } from '../shared/utils/database';
import { RedisManager } from '../shared/utils/redis';

export class AuctionWorker {
  async process(job: Job): Promise<any> {
    const { type, data } = job.data;

    logger.info(`Processing auction job: ${type}`, { jobId: job.id });

    switch (type) {
      case 'end_auction':
        return this.endAuction(data);
      case 'extend_auction':
        return this.extendAuction(data);
      case 'process_bid':
        return this.processBid(data);
      case 'check_expiring':
        return this.checkExpiringAuctions(data);
      default:
        throw new Error(`Unknown auction type: ${type}`);
    }
  }

  private async endAuction(data: any): Promise<any> {
    const { auctionId, nftId } = data;
    
    const db = DatabaseManager.getInstance();
    
    // Get auction details
    const auction = await db('auctions')
      .where('id', auctionId)
      .first();
    
    if (!auction || auction.status !== 'active') {
      throw new Error('Auction not found or already ended');
    }

    // Determine winner
    const highestBid = await db('bids')
      .where('auction_id', auctionId)
      .orderBy('amount', 'desc')
      .first();

    if (highestBid && highestBid.amount >= auction.reserve_price) {
      // Reserve met - process sale
      await db.transaction(async (trx) => {
        await trx('auctions')
          .where('id', auctionId)
          .update({
            status: 'completed',
            winner_id: highestBid.bidder_id,
            final_price: highestBid.amount,
            ended_at: new Date(),
          });

        await trx('nfts')
          .where('id', nftId)
          .update({ owner_id: highestBid.bidder_id });
      });

      // Notify winner and seller
      await this.notifyAuctionEnd(auctionId, highestBid.bidder_id, true);
    } else {
      // Reserve not met - cancel auction
      await db('auctions')
        .where('id', auctionId)
        .update({
          status: 'cancelled',
          ended_at: new Date(),
        });

      // Refund highest bidder if exists
      if (highestBid) {
        await this.refundBidder(highestBid.bidder_id, highestBid.amount);
      }

      await this.notifyAuctionEnd(auctionId, null, false);
    }

    return { success: true, auctionId, winner: highestBid?.bidder_id || null };
  }

  private async extendAuction(data: any): Promise<any> {
    const { auctionId, extensionSeconds } = data;
    
    const db = DatabaseManager.getInstance();
    
    const auction = await db('auctions')
      .where('id', auctionId)
      .first();
    
    if (!auction) {
      throw new Error('Auction not found');
    }

    const newEndTime = new Date(auction.end_time);
    newEndTime.setSeconds(newEndTime.getSeconds() + extensionSeconds);

    await db('auctions')
      .where('id', auctionId)
      .update({ end_time: newEndTime });

    return { success: true, auctionId, newEndTime };
  }

  private async processBid(data: any): Promise<any> {
    const { auctionId, bidderId, amount } = data;
    
    const db = DatabaseManager.getInstance();
    
    // Record bid
    await db('bids').insert({
      auction_id: auctionId,
      bidder_id: bidderId,
      amount,
      created_at: new Date(),
    });

    // Update auction current bid
    await db('auctions')
      .where('id', auctionId)
      .update({ current_bid: amount });

    // Notify outbid users
    await this.notifyOutbid(auctionId, bidderId, amount);

    return { success: true, auctionId, bidderId, amount };
  }

  private async checkExpiringAuctions(data: any): Promise<any> {
    const { hours } = data;
    
    const db = DatabaseManager.getInstance();
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() + hours);

    const expiringAuctions = await db('auctions')
      .where('status', 'active')
      .where('end_time', '<=', cutoffTime)
      .where('end_time', '>', new Date())
      .select('*');

    for (const auction of expiringAuctions) {
      await this.notifyExpiringSoon(auction);
    }

    return { count: expiringAuctions.length, auctions: expiringAuctions };
  }

  private async notifyAuctionEnd(auctionId: string, winnerId: string | null, success: boolean): Promise<void> {
    await RedisManager.getInstance().publish('notifications', JSON.stringify({
      type: 'auction_ended',
      auctionId,
      winnerId,
      success,
    }));
  }

  private async notifyOutbid(auctionId: string, newBidderId: string, amount: number): Promise<void> {
    await RedisManager.getInstance().publish('notifications', JSON.stringify({
      type: 'outbid',
      auctionId,
      newBidderId,
      amount,
    }));
  }

  private async notifyExpiringSoon(auction: any): Promise<void> {
    await RedisManager.getInstance().publish('notifications', JSON.stringify({
      type: 'auction_expiring_soon',
      auctionId: auction.id,
      endTime: auction.end_time,
    }));
  }

  private async refundBidder(bidderId: string, amount: number): Promise<void> {
    const db = DatabaseManager.getInstance();
    
    await db('users')
      .where('id', bidderId)
      .increment('balance', amount);
  }
}
