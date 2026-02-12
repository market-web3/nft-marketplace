/**
 * Listing Routes - Sales, Auctions, Offers
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ListingController } from '../../services/auction/listing.controller';
import { authenticate } from '../../shared/middleware/authenticate';

const router = Router();
const controller = new ListingController();

// Get all active listings
router.get('/',
  [
    query('type').optional().isIn(['fixed', 'auction']),
    query('category').optional().isUUID(),
    query('minPrice').optional().isNumeric(),
    query('maxPrice').optional().isNumeric(),
    query('seller').optional().isUUID(),
    query('sortBy').optional().isIn(['price', 'created', 'ending']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  controller.getListings
);

// Get listing by ID
router.get('/:id',
  param('id').isUUID(),
  controller.getListingById
);

// Get listing by NFT
router.get('/nft/:nftId',
  param('nftId').isUUID(),
  controller.getListingByNFT
);

// Create fixed price listing
router.post('/fixed',
  authenticate,
  [
    body('nftId').isUUID(),
    body('price').isNumeric().custom((v) => parseFloat(v) > 0),
    body('duration').optional().isInt({ min: 300, max: 2592000 }), // 5min to 30 days
  ],
  controller.createFixedListing
);

// Create auction listing
router.post('/auction',
  authenticate,
  [
    body('nftId').isUUID(),
    body('startPrice').isNumeric().custom((v) => parseFloat(v) > 0),
    body('reservePrice').optional().isNumeric(),
    body('minBidIncrement').optional().isNumeric(),
    body('duration').isInt({ min: 300, max: 604800 }), // 5min to 7 days
  ],
  controller.createAuctionListing
);

// Update listing price
router.patch('/:id/price',
  authenticate,
  [
    param('id').isUUID(),
    body('price').isNumeric().custom((v) => parseFloat(v) > 0),
  ],
  controller.updatePrice
);

// Cancel listing
router.delete('/:id',
  authenticate,
  param('id').isUUID(),
  controller.cancelListing
);

// Buy NFT (fixed price)
router.post('/:id/buy',
  authenticate,
  [
    param('id').isUUID(),
    body('useVirtualBalance').optional().isBoolean(),
    body('hashComment').isString().trim().notEmpty(),
  ],
  controller.buyNFT
);

// Place bid on auction
router.post('/:id/bid',
  authenticate,
  [
    param('id').isUUID(),
    body('amount').isNumeric().custom((v) => parseFloat(v) > 0),
    body('useVirtualBalance').optional().isBoolean(),
  ],
  controller.placeBid
);

// End auction (anyone can call after expiry)
router.post('/:id/end-auction',
  authenticate,
  param('id').isUUID(),
  controller.endAuction
);

// Extend auction (seller only)
router.post('/:id/extend',
  authenticate,
  [
    param('id').isUUID(),
    body('extension').isInt({ min: 300, max: 604800 }), // 5min to 7 days
  ],
  controller.extendAuction
);

// Get bids for auction
router.get('/:id/bids',
  param('id').isUUID(),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  controller.getBids
);

// === OFFERS ===

// Get offers for NFT
router.get('/nft/:nftId/offers',
  param('nftId').isUUID(),
  [
    query('status').optional().isIn(['pending', 'accepted', 'rejected']),
  ],
  controller.getOffersForNFT
);

// Make offer on NFT
router.post('/nft/:nftId/offer',
  authenticate,
  [
    param('nftId').isUUID(),
    body('price').isNumeric().custom((v) => parseFloat(v) > 0),
    body('expiresIn').isInt({ min: 300, max: 604800 }),
    body('useVirtualBalance').optional().isBoolean(),
  ],
  controller.makeOffer
);

// Accept offer
router.post('/offers/:offerId/accept',
  authenticate,
  [
    param('offerId').isUUID(),
    body('hashComment').isString().trim().notEmpty(),
  ],
  controller.acceptOffer
);

// Reject offer
router.post('/offers/:offerId/reject',
  authenticate,
  param('offerId').isUUID(),
  controller.rejectOffer
);

// Cancel offer
router.delete('/offers/:offerId',
  authenticate,
  param('offerId').isUUID(),
  controller.cancelOffer
);

// Get user's offers
router.get('/user/offers',
  authenticate,
  [
    query('as').optional().isIn(['buyer', 'seller']),
    query('status').optional().isIn(['pending', 'accepted', 'rejected', 'expired']),
  ],
  controller.getUserOffers
);

export { router as listingRouter };
