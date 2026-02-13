/**
 * Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from './errorHandler';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.type === 'field' ? err.path : err.type,
      message: err.msg,
      value: err.type === 'field' ? err.value : undefined,
    }));

    throw new AppError(
      400,
      'Validation failed',
      'VALIDATION_ERROR',
      { errors: formattedErrors }
    );
  }
  
  next();
};

// Auth validators
export const walletAuthValidator = [
  body('walletAddress')
    .isString()
    .notEmpty()
    .withMessage('Wallet address is required')
    .matches(/^EQ[0-9A-Za-z_-]{43,48}$/)
    .withMessage('Invalid TON wallet address'),
  body('signature')
    .isString()
    .notEmpty()
    .withMessage('Signature is required'),
  body('nonce')
    .isString()
    .notEmpty()
    .withMessage('Nonce is required'),
  handleValidationErrors,
];

// NFT validators
export const createNFTValidator = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),
  body('imageUrl')
    .isURL()
    .withMessage('Valid image URL is required'),
  body('categoryId')
    .isUUID()
    .withMessage('Valid category ID is required'),
  handleValidationErrors,
];

export const depositNFTValidator = [
  body('nftAddress')
    .isString()
    .notEmpty()
    .withMessage('NFT address is required')
    .matches(/^EQ[0-9A-Za-z_-]{43,48}$/)
    .withMessage('Invalid NFT address'),
  body('transactionHash')
    .isString()
    .notEmpty()
    .withMessage('Transaction hash is required'),
  handleValidationErrors,
];

// Listing validators
export const createListingValidator = [
  body('nftId')
    .isUUID()
    .withMessage('Valid NFT ID is required'),
  body('price')
    .isInt({ min: 10000000 })
    .withMessage('Price must be at least 0.01 TON (in nanotons)'),
  body('type')
    .isIn(['fixed', 'auction'])
    .withMessage('Type must be fixed or auction'),
  body('auctionDuration')
    .optional()
    .isInt({ min: 7, max: 365 })
    .withMessage('Auction duration must be between 7 and 365 days'),
  body('reservePrice')
    .optional()
    .isInt({ min: 10000000 })
    .withMessage('Reserve price must be at least 0.01 TON'),
  handleValidationErrors,
];

export const placeBidValidator = [
  body('amount')
    .isInt({ min: 10000000 })
    .withMessage('Bid amount must be at least 0.01 TON'),
  handleValidationErrors,
];

// Offer validators
export const createOfferValidator = [
  body('nftId')
    .isUUID()
    .withMessage('Valid NFT ID is required'),
  body('amount')
    .isInt({ min: 10000000 })
    .withMessage('Offer amount must be at least 0.01 TON'),
  body('duration')
    .isInt({ min: 1, max: 30 })
    .withMessage('Duration must be between 1 and 30 days'),
  handleValidationErrors,
];

// Query validators
export const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

export const nftFilterValidator = [
  ...paginationValidator,
  query('category')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID'),
  query('minPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Invalid minimum price'),
  query('maxPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Invalid maximum price'),
  query('sortBy')
    .optional()
    .isIn(['price', 'createdAt', 'views', 'likes'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Invalid sort order'),
  handleValidationErrors,
];
