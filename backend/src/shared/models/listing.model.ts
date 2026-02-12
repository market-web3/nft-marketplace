/**
 * Listing Model - Sales, Auctions, Offers
 */

import { Knex } from 'knex';

export interface IListing {
  id: string;
  nftId: string;
  sellerId: string;
  type: ListingType;
  price: string;
  startPrice: string | null;
  reservePrice: string | null;
  minBidIncrement: string | null;
  startTime: Date | null;
  endTime: Date | null;
  status: ListingStatus;
  highestBidderId: string | null;
  highestBid: string | null;
  bidCount: number;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  completedAt: Date | null;
}

export type ListingType = 'fixed' | 'auction';
export type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired';

export interface IBid {
  id: string;
  listingId: string;
  bidderId: string;
  amount: string;
  timestamp: Date;
  isRefunded: boolean;
  refundedAt: Date | null;
  transactionHash: string | null;
}

export interface IOffer {
  id: string;
  nftId: string;
  buyerId: string;
  sellerId: string;
  price: string;
  expiresAt: Date;
  status: OfferStatus;
  createdAt: Date;
  respondedAt: Date | null;
  transactionHash: string | null;
}

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export class ListingModel {
  private static listingsTable = 'listings';
  private static bidsTable = 'bids';
  private static offersTable = 'offers';

  // Listing methods
  static async createListing(knex: Knex, data: Partial<IListing>): Promise<IListing> {
    const [listing] = await knex(this.listingsTable)
      .insert({
        ...data,
        status: 'active',
        bidCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning('*');
    return this.parseListing(listing);
  }

  static async findById(knex: Knex, id: string): Promise<IListing | null> {
    const listing = await knex(this.listingsTable).where({ id }).first();
    return listing ? this.parseListing(listing) : null;
  }

  static async findActiveByNft(knex: Knex, nftId: string): Promise<IListing | null> {
    const listing = await knex(this.listingsTable)
      .where({ nftId, status: 'active' })
      .andWhere('endTime', '>', new Date())
      .first();
    return listing ? this.parseListing(listing) : null;
  }

  static async getActiveListings(
    knex: Knex,
    filters?: {
      type?: ListingType;
      minPrice?: string;
      maxPrice?: string;
      sellerId?: string;
      categoryId?: string;
    },
    pagination?: { limit: number; offset: number }
  ): Promise<{ items: IListing[]; total: number }> {
    let query = knex(this.listingsTable)
      .where({ status: 'active' })
      .andWhere(function() {
        this.whereNull('endTime').orWhere('endTime', '>', new Date());
      });

    if (filters?.type) {
      query = query.where({ type: filters.type });
    }
    if (filters?.sellerId) {
      query = query.where({ sellerId: filters.sellerId });
    }
    if (filters?.minPrice) {
      query = query.where('price', '>=', filters.minPrice);
    }
    if (filters?.maxPrice) {
      query = query.where('price', '<=', filters.maxPrice);
    }

    // Join with NFTs if category filter
    if (filters?.categoryId) {
      query = query
        .join('nfts', 'listings.nft_id', 'nfts.id')
        .where('nfts.category_id', filters.categoryId);
    }

    const totalQuery = query.clone();
    const total = await totalQuery.count('listings.id as count').first();

    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }

    query = query.orderBy('createdAt', 'desc');
    const listings = await query;

    return {
      items: listings.map(this.parseListing),
      total: parseInt(total?.count as string, 10) || 0,
    };
  }

  static async update(knex: Knex, id: string, data: Partial<IListing>): Promise<IListing | null> {
    const [listing] = await knex(this.listingsTable)
      .where({ id })
      .update({ ...data, updatedAt: new Date() })
      .returning('*');
    return listing ? this.parseListing(listing) : null;
  }

  static async markAsSold(
    knex: Knex,
    id: string,
    buyerId: string,
    finalPrice: string
  ): Promise<boolean> {
    const result = await knex(this.listingsTable)
      .where({ id })
      .update({
        status: 'sold',
        highestBidderId: buyerId,
        highestBid: finalPrice,
        completedAt: new Date(),
        updatedAt: new Date(),
      });
    return result > 0;
  }

  static async cancel(knex: Knex, id: string): Promise<boolean> {
    const result = await knex(this.listingsTable)
      .where({ id, status: 'active' })
      .update({
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      });
    return result > 0;
  }

  static async expire(knex: Knex, id: string): Promise<boolean> {
    const result = await knex(this.listingsTable)
      .where({ id, status: 'active' })
      .update({
        status: 'expired',
        updatedAt: new Date(),
      });
    return result > 0;
  }

  static async placeBid(
    knex: Knex,
    listingId: string,
    bidderId: string,
    amount: string
  ): Promise<IBid> {
    const [bid] = await knex(this.bidsTable)
      .insert({
        listingId,
        bidderId,
        amount,
        timestamp: new Date(),
        isRefunded: false,
      })
      .returning('*');

    // Update listing
    await knex(this.listingsTable)
      .where({ id: listingId })
      .update({
        highestBidderId: bidderId,
        highestBid: amount,
        bidCount: knex.raw('bid_count + 1'),
        updatedAt: new Date(),
      });

    return this.parseBid(bid);
  }

  static async getBidsForListing(knex: Knex, listingId: string): Promise<IBid[]> {
    const bids = await knex(this.bidsTable)
      .where({ listingId })
      .orderBy('timestamp', 'desc');
    return bids.map(this.parseBid);
  }

  static async refundBid(knex: Knex, bidId: string): Promise<boolean> {
    const result = await knex(this.bidsTable)
      .where({ id: bidId })
      .update({
        isRefunded: true,
        refundedAt: new Date(),
      });
    return result > 0;
  }

  // Offer methods
  static async createOffer(knex: Knex, data: Partial<IOffer>): Promise<IOffer> {
    const [offer] = await knex(this.offersTable)
      .insert({
        ...data,
        status: 'pending',
        createdAt: new Date(),
      })
      .returning('*');
    return this.parseOffer(offer);
  }

  static async findOfferById(knex: Knex, id: string): Promise<IOffer | null> {
    const offer = await knex(this.offersTable).where({ id }).first();
    return offer ? this.parseOffer(offer) : null;
  }

  static async getPendingOffersForNft(knex: Knex, nftId: string): Promise<IOffer[]> {
    const offers = await knex(this.offersTable)
      .where({ nftId, status: 'pending' })
      .andWhere('expiresAt', '>', new Date())
      .orderBy('createdAt', 'desc');
    return offers.map(this.parseOffer);
  }

  static async getPendingOffersByUser(
    knex: Knex,
    userId: string,
    as: 'buyer' | 'seller'
  ): Promise<IOffer[]> {
    const field = as === 'buyer' ? 'buyerId' : 'sellerId';
    const offers = await knex(this.offersTable)
      .where({ [field]: userId, status: 'pending' })
      .andWhere('expiresAt', '>', new Date())
      .orderBy('createdAt', 'desc');
    return offers.map(this.parseOffer);
  }

  static async respondToOffer(
    knex: Knex,
    id: string,
    status: 'accepted' | 'rejected',
    transactionHash?: string
  ): Promise<boolean> {
    const update: any = {
      status,
      respondedAt: new Date(),
    };
    if (transactionHash) {
      update.transactionHash = transactionHash;
    }

    const result = await knex(this.offersTable)
      .where({ id, status: 'pending' })
      .update(update);
    return result > 0;
  }

  static async expireOffers(knex: Knex): Promise<number> {
    const result = await knex(this.offersTable)
      .where({ status: 'pending' })
      .andWhere('expiresAt', '<=', new Date())
      .update({ status: 'expired' });
    return result;
  }

  // Parsers
  private static parseListing(row: any): IListing {
    return {
      id: row.id,
      nftId: row.nft_id,
      sellerId: row.seller_id,
      type: row.type,
      price: row.price,
      startPrice: row.start_price,
      reservePrice: row.reserve_price,
      minBidIncrement: row.min_bid_increment,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status,
      highestBidderId: row.highest_bidder_id,
      highestBid: row.highest_bid,
      bidCount: row.bid_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      cancelledAt: row.cancelled_at,
      completedAt: row.completed_at,
    };
  }

  private static parseBid(row: any): IBid {
    return {
      id: row.id,
      listingId: row.listing_id,
      bidderId: row.bidder_id,
      amount: row.amount,
      timestamp: row.timestamp,
      isRefunded: row.is_refunded,
      refundedAt: row.refunded_at,
      transactionHash: row.transaction_hash,
    };
  }

  private static parseOffer(row: any): IOffer {
    return {
      id: row.id,
      nftId: row.nft_id,
      buyerId: row.buyer_id,
      sellerId: row.seller_id,
      price: row.price,
      expiresAt: row.expires_at,
      status: row.status,
      createdAt: row.created_at,
      respondedAt: row.responded_at,
      transactionHash: row.transaction_hash,
    };
  }
}
