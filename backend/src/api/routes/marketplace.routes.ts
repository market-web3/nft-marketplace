/**
 * Marketplace Routes
 * General marketplace operations
 */

import { Router } from 'express';
import { query } from 'express-validator';
import { MarketplaceController } from '../../services/marketplace/marketplace.controller';
import { authenticate, optionalAuth } from '../../shared/middleware/authenticate';

const router = Router();
const controller = new MarketplaceController();

// Get marketplace stats
router.get('/stats', controller.getStats);

// Get trending NFTs
router.get('/trending',
  [
    query('period').optional().isIn(['24h', '7d', '30d']),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  controller.getTrending
);

// Get featured NFTs
router.get('/featured',
  [
    query('limit').optional().isInt({ min: 1, max: 20 }),
  ],
  controller.getFeatured
);

// Get recent activity
router.get('/activity',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['sale', 'listing', 'bid', 'offer', 'transfer']),
  ],
  controller.getRecentActivity
);

// Get categories
router.get('/categories', controller.getCategories);

// Get category by ID
router.get('/categories/:id', controller.getCategoryById);

// Get leaderboard
router.get('/leaderboard',
  [
    query('type').optional().isIn(['volume', 'sales', 'created']),
    query('period').optional().isIn(['24h', '7d', '30d', 'all']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  controller.getLeaderboard
);

// Search marketplace
router.get('/search',
  [
    query('q').isString().trim().notEmpty(),
    query('type').optional().isIn(['nfts', 'users', 'collections']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  controller.search
);

// Get gas prices
router.get('/gas-prices', controller.getGasPrices);

// Get floor prices by category
router.get('/floor-prices', controller.getFloorPrices);

// Get price history for NFT
router.get('/price-history/:nftId',
  [
    query('period').optional().isIn(['24h', '7d', '30d', '90d', '1y']),
  ],
  controller.getPriceHistory
);

export { router as marketplaceRouter };
