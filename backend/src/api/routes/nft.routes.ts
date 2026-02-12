/**
 * NFT Routes
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { NFTController } from '../../services/nft/nft.controller';
import { authenticate } from '../../shared/middleware/authenticate';

const router = Router();
const controller = new NFTController();

// Get all NFTs with filters
router.get('/', 
  [
    query('category').optional().isUUID(),
    query('owner').optional().isUUID(),
    query('status').optional().isIn(['in_wallet', 'deposited', 'listed', 'auction', 'offered']),
    query('minPrice').optional().isNumeric(),
    query('maxPrice').optional().isNumeric(),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  controller.getNFTs
);

// Search NFTs
router.get('/search',
  [
    query('q').isString().trim().notEmpty(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  controller.searchNFTs
);

// Get NFT categories
router.get('/categories', controller.getCategories);

// Get NFT collections
router.get('/collections', controller.getCollections);

// Get NFT by ID
router.get('/:id',
  param('id').isUUID(),
  controller.getNFTById
);

// Get NFT by address
router.get('/address/:address',
  param('address').isString().trim().notEmpty(),
  controller.getNFTByAddress
);

// Get user's NFTs
router.get('/user/:userId',
  param('userId').isUUID(),
  [
    query('status').optional().isIn(['in_wallet', 'deposited', 'listed', 'auction', 'offered', 'offchain']),
    query('category').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  controller.getUserNFTs
);

// Deposit NFT to marketplace
router.post('/deposit',
  authenticate,
  [
    body('nftAddress').isString().trim().notEmpty(),
    body('categoryId').optional().isUUID(),
    body('hashComment').isString().trim().notEmpty(),
  ],
  controller.depositNFT
);

// Withdraw NFT from marketplace
router.post('/withdraw',
  authenticate,
  [
    body('nftId').isUUID(),
    body('toAddress').isString().trim().notEmpty(),
    body('hashComment').isString().trim().notEmpty(),
  ],
  controller.withdrawNFT
);

// Send NFT as gift
router.post('/gift',
  authenticate,
  [
    body('nftId').isUUID(),
    body('recipientAddress').isString().trim().notEmpty(),
    body('message').optional().isString().maxLength(500),
  ],
  controller.sendGift
);

// Receive offchain gift (Telegram)
router.post('/receive-gift',
  authenticate,
  [
    body('giftId').isString().trim().notEmpty(),
    body('telegramData').isObject(),
  ],
  controller.receiveOffchainGift
);

// Get NFT metadata
router.get('/:id/metadata',
  param('id').isUUID(),
  controller.getNFTMetadata
);

// Get NFT history
router.get('/:id/history',
  param('id').isUUID(),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  controller.getNFTHistory
);

// Get NFT price estimate
router.get('/:id/price-estimate',
  param('id').isUUID(),
  controller.getPriceEstimate
);

// Batch operations (mint, transfer, etc.)
router.post('/batch',
  authenticate,
  [
    body('operation').isIn(['mint', 'transfer', 'deposit', 'withdraw']),
    body('items').isArray({ min: 1, max: 100 }),
  ],
  controller.batchOperation
);

export { router as nftRouter };
