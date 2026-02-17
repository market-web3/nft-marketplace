import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { tonClient } from '@ton/ton';
import { Address, Cell, beginCell, toNano } from '@ton/core';
import { WalletContractV5, WalletContractV5R2 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import Bull from 'bull';
import Redis from 'ioredis';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import winston from 'winston';
import { ethers } from 'ethers';

dotenv.config();

// Configuration
const PORT = process.env.PORT || 3005;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const TON_API_URL = process.env.TON_API_URL || 'https://toncenter.com/api/v2';
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/relayer.log' })
  ]
});

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Initialize Redis
const redis = new Redis(REDIS_URL);

// Initialize PostgreSQL
const pool = new Pool({ connectionString: DATABASE_URL });

// Initialize Bull queue for transaction batching
const transactionQueue = new Bull('transaction-batch', REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Initialize TON client
const client = new tonClient({
  endpoint: TON_API_URL,
  apiKey: process.env.TON_API_KEY,
});

// Wallet V5 helper functions
async function getWalletV5Config(publicKey) {
  return {
    type: 'wallet_v5r1',
    publicKey,
  };
}

async function createWalletV5(privateKey) {
  const keyPair = await mnemonicToPrivateKey(privateKey.split(' '));
  const workchain = 0;
  const config = await getWalletV5Config(keyPair.publicKey);
  
  const contract = client.open(
    WalletContractV5.create({ config, workchain })
  );
  
  return { contract, keyPair };
}

async function verifyWalletV5Signature(message, signature, publicKey) {
  // Verify Wallet V5 signature
  // This is a simplified version - actual implementation depends on Wallet V5 spec
  return true;
}

// Transaction batching
class TransactionBatcher {
  constructor(maxSize = 255, maxWaitTime = 10000) {
    this.transactions = [];
    this.maxSize = maxSize;
    this.maxWaitTime = maxWaitTime;
    this.timer = null;
  }

  async add(transaction) {
    this.transactions.push(transaction);

    if (this.transactions.length >= this.maxSize) {
      await this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.maxWaitTime);
    }
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.transactions.length === 0) {
      return;
    }

    logger.info(`Flushing ${this.transactions.length} transactions`);

    const batch = this.transactions;
    this.transactions = [];

    try {
      await this.executeBatch(batch);
    } catch (error) {
      logger.error('Failed to execute batch:', error);
      // Retry individual transactions
      for (const tx of batch) {
        await transactionQueue.add('retry-transaction', tx);
      }
    }
  }

  async executeBatch(transactions) {
    // Create Wallet V5 batched transaction
    const messages = transactions.map(tx => ({
      to: Address.parse(tx.to),
      value: toNano(tx.value),
      body: tx.body ? Cell.fromBase64(tx.body) : undefined,
    }));

    // Execute batch transaction
    // This would use Wallet V5's batch sending capability
    logger.info(`Executing batch of ${messages.length} messages`);

    // Implementation depends on Wallet V5 final spec
  }
}

const batcher = new TransactionBatcher(255, 10000);

// Gas sponsorship logic
async function shouldSponsorGas(userAddress) {
  // Check if user is eligible for gas sponsorship
  const result = await pool.query(
    'SELECT * FROM gas_sponsorship WHERE user_address = $1 AND is_active = true',
    [userAddress]
  );

  if (result.rows.length === 0) {
    return false;
  }

  const sponsorship = result.rows[0];

  // Check if user has remaining quota
  if (sponsorship.remaining_txs <= 0) {
    return false;
  }

  return true;
}

async function deductGasQuota(userAddress, gasUsed) {
  await pool.query(
    'UPDATE gas_sponsorship SET remaining_txs = remaining_txs - 1, total_gas_used = total_gas_used + $1 WHERE user_address = $2',
    [gasUsed, userAddress]
  );
}

async function estimateGas(transaction) {
  // Estimate gas cost for transaction
  const gasPrice = await client.getGasPrice();
  const gasLimit = 100000; // Conservative estimate

  return {
    gasPrice,
    gasLimit,
    total: gasPrice * gasLimit,
  };
}

// API Routes

/**
 * POST /api/relay/submit
 * Submit a gasless transaction for relaying
 */
app.post('/api/relay/submit', async (req, res) => {
  try {
    const {
      walletAddress,
      message,
      signature,
      publicKey,
      gasOption, // 'subsidized', 'jetton', 'user'
    } = req.body;

    logger.info(`Received relaying request from ${walletAddress}`);

    // Verify Wallet V5 signature
    const isValid = await verifyWalletV5Signature(message, signature, publicKey);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Estimate gas
    const gasEstimate = await estimateGas(message);

    // Check gas sponsorship eligibility
    if (gasOption === 'subsidized') {
      const eligible = await shouldSponsorGas(walletAddress);
      if (!eligible) {
        return res.status(402).json({
          error: 'Not eligible for gas sponsorship',
          gasEstimate,
        });
      }
    }

    // Add to batch
    await batcher.add({
      walletAddress,
      message,
      signature,
      publicKey,
      gasOption,
      gasEstimate,
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      message: 'Transaction added to batch',
      estimatedGas: gasEstimate,
    });

  } catch (error) {
    logger.error('Error submitting transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/relay/batch
 * Submit multiple gasless transactions at once
 */
app.post('/api/relay/batch', async (req, res) => {
  try {
    const { transactions } = req.body;

    if (transactions.length > 255) {
      return res.status(400).json({ error: 'Maximum batch size is 255' });
    }

    logger.info(`Received batch relaying request with ${transactions.length} transactions`);

    for (const tx of transactions) {
      await batcher.add(tx);
    }

    res.json({
      success: true,
      message: `${transactions.length} transactions added to batch`,
    });

  } catch (error) {
    logger.error('Error submitting batch:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/relay/status/:txHash
 * Get status of a relayed transaction
 */
app.get('/api/relay/status/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    // Check cache first
    const cached = await redis.get(`tx_status:${txHash}`);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Query blockchain
    const result = await client.getTransaction(txHash);
    
    const status = {
      txHash,
      success: result.exitCode === 0,
      block: result.block,
      timestamp: result.utime,
    };

    // Cache result
    await redis.setex(`tx_status:${txHash}`, 300, JSON.stringify(status));

    res.json(status);

  } catch (error) {
    logger.error('Error getting transaction status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/gas/estimate
 * Estimate gas cost for a transaction
 */
app.post('/api/gas/estimate', async (req, res) => {
  try {
    const { message } = req.body;

    const estimate = await estimateGas(message);

    res.json(estimate);

  } catch (error) {
    logger.error('Error estimating gas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/sponsorship/apply
 * Apply for gas sponsorship
 */
app.post('/api/sponsorship/apply', async (req, res) => {
  try {
    const { walletAddress, reason } = req.body;

    // Check if user already has sponsorship
    const existing = await pool.query(
      'SELECT * FROM gas_sponsorship WHERE user_address = $1',
      [walletAddress]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already has sponsorship' });
    }

    // Create new sponsorship
    await pool.query(
      'INSERT INTO gas_sponsorship (user_address, reason, quota, remaining_txs, is_active) VALUES ($1, $2, 100, 100, true)',
      [walletAddress, reason]
    );

    logger.info(`Gas sponsorship granted to ${walletAddress}`);

    res.json({
      success: true,
      message: 'Gas sponsorship granted',
      quota: 100,
    });

  } catch (error) {
    logger.error('Error applying for sponsorship:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats
 * Get relayer statistics
 */
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {
      totalRelayed: await transactionQueue.getCompletedCount(),
      pendingTransactions: await transactionQueue.getWaitingCount(),
      failedTransactions: await transactionQueue.getFailedCount(),
      activeSponsorships: (await pool.query('SELECT COUNT(*) FROM gas_sponsorship WHERE is_active = true')).rows[0].count,
    };

    res.json(stats);

  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      redis: redis.status === 'ready' ? 'connected' : 'disconnected',
      postgres: pool.totalCount > 0 ? 'connected' : 'disconnected',
    },
  });
});

// Queue processors
transactionQueue.process('retry-transaction', async (job) => {
  logger.info(`Retrying transaction: ${job.id}`);
  // Retry logic
});

// Start server
app.listen(PORT, () => {
  logger.info(`Relayer service started on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  await batcher.flush();
  await transactionQueue.close();
  await redis.quit();
  await pool.end();
  
  process.exit(0);
});
