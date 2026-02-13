/**
 * API Server
 * HTTP REST API for the NFT Marketplace
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

import { config, features } from '../shared/config/env';
import { logger } from '../shared/utils/logger';
import { errorHandler } from '../shared/middleware/errorHandler';
import { requestLogger } from '../shared/middleware/requestLogger';
import { authLimiter, apiLimiter } from '../shared/middleware/rateLimiter';

// Routes
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { nftRouter } from './routes/nft.routes';
import { listingRouter } from './routes/listing.routes';
import { transactionRouter } from './routes/transaction.routes';
import { marketplaceRouter } from './routes/marketplace.routes';
import { adminRouter } from './routes/admin.routes';
import { healthRouter } from './routes/health.routes';
import { webhookRouter } from './routes/webhook.routes';

export class APIServer {
  private app: Application;
  private server: ReturnType<typeof createServer> | null = null;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", 'wss:', 'https:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS
    this.app.use(cors({
      origin: config.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') || []
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Request logging
    this.app.use(requestLogger);

    // Rate limiting
    if (features.ENABLE_RATE_LIMITING) {
      this.app.use('/api/auth', authLimiter);
      this.app.use('/api', apiLimiter);
    }

    // Trust proxy for rate limiting
    this.app.set('trust proxy', 1);
  }

  private setupRoutes(): void {
    // Health check (no rate limit)
    this.app.use('/health', healthRouter);

    // API routes
    this.app.use('/api/auth', authRouter);
    this.app.use('/api/users', userRouter);
    this.app.use('/api/nfts', nftRouter);
    this.app.use('/api/listings', listingRouter);
    this.app.use('/api/transactions', transactionRouter);
    this.app.use('/api/marketplace', marketplaceRouter);
    this.app.use('/api/admin', adminRouter);
    this.app.use('/api/webhooks', webhookRouter);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  async start(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer(this.app);
      this.server.listen(port, () => {
        logger.info(`API Server started on port ${port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            logger.error('Error closing API server:', err);
            reject(err);
          } else {
            logger.info('API Server stopped');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  getApp(): Application {
    return this.app;
  }
}
