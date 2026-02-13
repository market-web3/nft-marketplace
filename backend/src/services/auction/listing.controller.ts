/**
 * Listing Controller
 * Handles sales, auctions, and offers
 */

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DatabaseManager } from '../../shared/utils/database';
import { APIError, asyncHandler } from '../../shared/middleware/errorHandler';
import { WorkerManager } from '../../workers/manager';

export class ListingController {
  private workerManager: WorkerManager;

  constructor() {
    this.workerManager = new WorkerManager();
  }

  // Get all active listings
  getListings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const category = req.query.category as string;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const seller = req.query.seller as string;
    const sortBy = req.query.sortBy as string || 'created';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const db = DatabaseManager.getInstance();
    
    let query = db('listings')
      .leftJoin('nfts', 'listings.nft_id', 'nfts.id')
      .leftJoin('users', 'listings.seller_id', 'users.id')
      .select(
        'listings.*',
        'nfts.name as nft_name',
        'nfts.image_url as nft_image',
        'nfts.metadata as nft_metadata',
        'users.username as seller_username',
        'users.wallet_address as seller_wallet'
      )
      .where('listings.status', 'active');

    if (type) query = query.where('listings.type', type);
    if (category) query = query.where('nfts.category_id', category);
    if (minPrice !== undefined) query = query.where('listings.price', '>=', minPrice);
    if (maxPrice !== undefined) query = query.where('listings.price', '<=', maxPrice);
    if (seller) query = query.where('listings.seller_id', seller);

    // Sorting
    const sortColumn = sortBy === 'price' ? 'listings.price' : 
                       sortBy === 'ending' ? 'listings.end_time' : 'listings.created_at';
    query = query.orderBy(sortColumn, sortOrder === 'asc' ? 'asc' : 'desc');

    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('listings.id as count');

    const listings = await query
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: {
        listings,
        pagination: {
          page,
          limit,
          total: parseInt(count as string),
          pages: Math.ceil(parseInt(count as string) / limit),
        },
      },
    });
  });

  // Get listing by ID
  getListingById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    const listing = await db('listings')
      .leftJoin('nfts', 'listings.nft_id', 'nfts.id')
      .leftJoin('users', 'listings.seller_id', 'users.id')
      .select(
        'listings.*',
        'nfts.name as nft_name',
        'nfts.image_url as nft_image',
        'nfts.metadata as nft_metadata',
        'users.username as seller_username'
      )
      .where('listings.id', id)
      .first();

    if (!listing) {
      throw new APIError(404, 'Listing not found', 'LISTING_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { listing },
    });
  });

  // Get listing by NFT
  getListingByNFT = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { nftId } = req.params;
    const db = DatabaseManager.getInstance();

    const listing = await db('listings')
      .where('nft_id', nftId)
      .where('status', 'active')
      .first();

    res.json({
      success: true,
      data: { listing },
    });
  });

  // Create fixed price listing
  createFixedListing = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { nftId, price, duration } = req.body;
    const db = DatabaseManager.getInstance();

    // Verify NFT ownership
    const nft = await db('nfts')
      .where('id', nftId)
      .where('owner_id', userId)
      .first();

    if (!nft) {
      throw new APIError(404, 'NFT not found or not owned by you', 'NFT_NOT_FOUND');
    }

    // Check if already listed
    const existingListing = await db('listings')
      .where('nft_id', nftId)
      .where('status', 'active')
      .first();

    if (existingListing) {
      throw new APIError(409, 'NFT is already listed', 'ALREADY_LISTED');
    }

    const endTime = duration 
      ? new Date(Date.now() + duration * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    const [listing] = await db('listings').insert({
      nft_id: nftId,
      seller_id: userId,
      type: 'fixed',
      price,
      end_time: endTime,
      status: 'active',
      created_at: new Date(),
    }).returning('*');

    // Update NFT status
    await db('nfts').where('id', nftId).update({ status: 'listed' });

    res.json({
      success: true,
      data: { listing },
    });
  });

  // Create auction listing
  createAuctionListing = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { nftId, startPrice, reservePrice, minBidIncrement, duration } = req.body;
    const db = DatabaseManager.getInstance();

    // Verify NFT ownership
    const nft = await db('nfts')
      .where('id', nftId)
      .where('owner_id', userId)
      .first();

    if (!nft) {
      throw new APIError(404, 'NFT not found or not owned by you', 'NFT_NOT_FOUND');
    }

    const endTime = new Date(Date.now() + duration * 1000);

    const [listing] = await db('listings').insert({
      nft_id: nftId,
      seller_id: userId,
      type: 'auction',
      start_price: startPrice,
      reserve_price: reservePrice,
      min_bid_increment: minBidIncrement || 0.1,
      current_bid: startPrice,
      end_time: endTime,
      status: 'active',
      created_at: new Date(),
    }).returning('*');

    // Create auction record
    await db('auctions').insert({
      listing_id: listing.id,
      start_price: startPrice,
      reserve_price: reservePrice,
      min_bid_increment: minBidIncrement || 0.1,
      end_time: endTime,
      status: 'active',
    });

    // Update NFT status
    await db('nfts').where('id', nftId).update({ status: 'auction' });

    res.json({
      success: true,
      data: { listing },
    });
  });

  // Update listing price
  updatePrice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { id } = req.params;
    const { price } = req.body;
    const db = DatabaseManager.getInstance();

    const listing = await db('listings')
      .where('id', id)
      .where('seller_id', userId)
      .first();

    if (!listing) {
      throw new APIError(404, 'Listing not found', 'LISTING_NOT_FOUND');
    }

    if (listing.type !== 'fixed') {
      throw new APIError(400, 'Can only update fixed price listings', 'INVALID_TYPE');
    }

    const [updated] = await db('listings')
      .where('id', id)
      .update({ price, updated_at: new Date() })
      .returning('*');

    res.json({
      success: true,
      data: { listing: updated },
    });
  });

  // Cancel listing
  cancelListing = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    const listing = await db('listings')
      .where('id', id)
      .where('seller_id', userId)
      .first();

    if (!listing) {
      throw new APIError(404, 'Listing not found', 'LISTING_NOT_FOUND');
    }

    await db.transaction(async (trx) => {
      await trx('listings')
        .where('id', id)
        .update({ status: 'cancelled', updated_at: new Date() });

      await trx('nfts')
        .where('id', listing.nft_id)
        .update({ status: 'in_wallet' });
    });

    res.json({
      success: true,
      message: 'Listing cancelled successfully',
    });
  });

  // Buy NFT (fixed price)
  buyNFT = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const buyerId = req.user!.id;
    const { id } = req.params;
    const { useVirtualBalance, hashComment } = req.body;
    const db = DatabaseManager.getInstance();

    const listing = await db('listings')
      .where('id', id)
      .where('status', 'active')
      .first();

    if (!listing) {
      throw new APIError(404, 'Listing not found', 'LISTING_NOT_FOUND');
    }

    if (listing.seller_id === buyerId) {
      throw new APIError(400, 'Cannot buy your own listing', 'SELF_PURCHASE');
    }

    // Queue purchase job
    await this.workerManager.addJob('transactions', 'process_purchase', {
      listingId: id,
      buyerId,
      sellerId: listing.seller_id,
      nftId: listing.nft_id,
      price: listing.price,
      useVirtualBalance,
      hashComment,
    });

    res.json({
      success: true,
      message: 'Purchase initiated',
    });
  });

  // Place bid on auction
  placeBid = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const bidderId = req.user!.id;
    const { id } = req.params;
    const { amount, useVirtualBalance } = req.body;
    const db = DatabaseManager.getInstance();

    const listing = await db('listings')
      .where('id', id)
      .where('status', 'active')
      .first();

    if (!listing) {
      throw new APIError(404, 'Listing not found', 'LISTING_NOT_FOUND');
    }

    if (listing.type !== 'auction') {
      throw new APIError(400, 'Not an auction listing', 'NOT_AUCTION');
    }

    if (listing.seller_id === bidderId) {
      throw new APIError(400, 'Cannot bid on your own auction', 'SELF_BID');
    }

    // Validate bid amount
    const minBid = listing.current_bid + (listing.min_bid_increment || 0.1);
    if (amount < minBid) {
      throw new APIError(400, `Bid must be at least ${minBid} TON`, 'BID_TOO_LOW');
    }

    // Queue bid job
    await this.workerManager.addJob('auctions', 'process_bid', {
      listingId: id,
      bidderId,
      amount,
      useVirtualBalance,
    });

    res.json({
      success: true,
      message: 'Bid placed successfully',
    });
  });

  // End auction
  endAuction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    const listing = await db('listings')
      .where('id', id)
      .where('type', 'auction')
      .first();

    if (!listing) {
      throw new APIError(404, 'Auction not found', 'AUCTION_NOT_FOUND');
    }

    if (new Date(listing.end_time) > new Date()) {
      throw new APIError(400, 'Auction has not ended yet', 'AUCTION_NOT_ENDED');
    }

    // Queue end auction job
    await this.workerManager.addJob('auctions', 'end_auction', {
      listingId: id,
      auctionId: listing.id,
      nftId: listing.nft_id,
    });

    res.json({
      success: true,
      message: 'Auction ending process initiated',
    });
  });

  // Extend auction
  extendAuction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { id } = req.params;
    const { extension } = req.body;
    const db = DatabaseManager.getInstance();

    const listing = await db('listings')
      .where('id', id)
      .where('seller_id', userId)
      .first();

    if (!listing) {
      throw new APIError(404, 'Listing not found', 'LISTING_NOT_FOUND');
    }

    const newEndTime = new Date(listing.end_time);
    newEndTime.setSeconds(newEndTime.getSeconds() + extension);

    await db('listings')
      .where('id', id)
      .update({ end_time: newEndTime, updated_at: new Date() });

    res.json({
      success: true,
      message: 'Auction extended successfully',
    });
  });

  // Get bids for auction
  getBids = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const db = DatabaseManager.getInstance();

    const bids = await db('bids')
      .leftJoin('users', 'bids.bidder_id', 'users.id')
      .select('bids.*', 'users.username as bidder_username')
      .where('bids.listing_id', id)
      .orderBy('bids.amount', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: { bids },
    });
  });

  // === OFFERS ===

  // Get offers for NFT
  getOffersForNFT = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const { nftId } = req.params;
    const status = req.query.status as string;
    const db = DatabaseManager.getInstance();

    let query = db('offers').where('nft_id', nftId);
    if (status) query = query.where('status', status);

    const offers = await query
      .leftJoin('users', 'offers.buyer_id', 'users.id')
      .select('offers.*', 'users.username as buyer_username')
      .orderBy('offers.amount', 'desc');

    res.json({
      success: true,
      data: { offers },
    });
  });

  // Make offer on NFT
  makeOffer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const buyerId = req.user!.id;
    const { nftId } = req.params;
    const { price, expiresIn, useVirtualBalance } = req.body;
    const db = DatabaseManager.getInstance();

    const nft = await db('nfts').where('id', nftId).first();
    if (!nft) {
      throw new APIError(404, 'NFT not found', 'NFT_NOT_FOUND');
    }

    if (nft.owner_id === buyerId) {
      throw new APIError(400, 'Cannot make offer on your own NFT', 'SELF_OFFER');
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const [offer] = await db('offers').insert({
      nft_id: nftId,
      buyer_id: buyerId,
      seller_id: nft.owner_id,
      amount: price,
      expires_at: expiresAt,
      status: 'pending',
      created_at: new Date(),
    }).returning('*');

    res.json({
      success: true,
      data: { offer },
    });
  });

  // Accept offer
  acceptOffer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { offerId } = req.params;
    const { hashComment } = req.body;
    const db = DatabaseManager.getInstance();

    const offer = await db('offers')
      .where('id', offerId)
      .where('seller_id', userId)
      .where('status', 'pending')
      .first();

    if (!offer) {
      throw new APIError(404, 'Offer not found', 'OFFER_NOT_FOUND');
    }

    // Queue accept offer job
    await this.workerManager.addJob('transactions', 'accept_offer', {
      offerId,
      sellerId: userId,
      buyerId: offer.buyer_id,
      nftId: offer.nft_id,
      amount: offer.amount,
      hashComment,
    });

    res.json({
      success: true,
      message: 'Offer acceptance initiated',
    });
  });

  // Reject offer
  rejectOffer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { offerId } = req.params;
    const db = DatabaseManager.getInstance();

    const offer = await db('offers')
      .where('id', offerId)
      .where('seller_id', userId)
      .where('status', 'pending')
      .first();

    if (!offer) {
      throw new APIError(404, 'Offer not found', 'OFFER_NOT_FOUND');
    }

    await db('offers')
      .where('id', offerId)
      .update({ status: 'rejected', updated_at: new Date() });

    res.json({
      success: true,
      message: 'Offer rejected',
    });
  });

  // Cancel offer
  cancelOffer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError(400, 'Validation error', 'VALIDATION_ERROR', errors.array());
    }

    const userId = req.user!.id;
    const { offerId } = req.params;
    const db = DatabaseManager.getInstance();

    const offer = await db('offers')
      .where('id', offerId)
      .where('buyer_id', userId)
      .where('status', 'pending')
      .first();

    if (!offer) {
      throw new APIError(404, 'Offer not found', 'OFFER_NOT_FOUND');
    }

    await db('offers')
      .where('id', offerId)
      .update({ status: 'cancelled', updated_at: new Date() });

    res.json({
      success: true,
      message: 'Offer cancelled',
    });
  });

  // Get user's offers
  getUserOffers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const as = req.query.as as string || 'buyer';
    const status = req.query.status as string;
    const db = DatabaseManager.getInstance();

    let query = db('offers');
    
    if (as === 'buyer') {
      query = query.where('buyer_id', userId);
    } else {
      query = query.where('seller_id', userId);
    }

    if (status) query = query.where('status', status);

    const offers = await query
      .leftJoin('nfts', 'offers.nft_id', 'nfts.id')
      .select('offers.*', 'nfts.name as nft_name', 'nfts.image_url as nft_image')
      .orderBy('offers.created_at', 'desc');

    res.json({
      success: true,
      data: { offers },
    });
  });
}
