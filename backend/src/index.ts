/**
 * NFT MARKETPLACE BACKEND
 * Main Application Entry Point
 */

import { logger } from './shared/utils/logger';
import { config } from './shared/config/env';
import { APIServer } from './api/server';
import { GatewayServer } from './gateway/server';
import { WorkerManager } from './workers/manager';
import { DatabaseManager } from './shared/utils/database';
import { RedisManager } from './shared/utils/redis';
import { RabbitMQManager } from './shared/utils/rabbitmq';
import { MetricsCollector } from './shared/utils/metrics';

class Application {
  private apiServer: APIServer;
  private gatewayServer: GatewayServer;
  private workerManager: WorkerManager;
  private metrics: MetricsCollector;
  private isShuttingDown: boolean = false;

  constructor() {
    this.apiServer = new APIServer();
    this.gatewayServer = new GatewayServer();
    this.workerManager = new WorkerManager();
    this.metrics = new MetricsCollector();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing NFT Marketplace Backend...');

    try {
      // Initialize database connections
      await DatabaseManager.initialize();
      logger.info('Database connections established');

      // Initialize Redis
      await RedisManager.initialize();
      logger.info('Redis connection established');

      // Initialize RabbitMQ
      await RabbitMQManager.initialize();
      logger.info('RabbitMQ connection established');

      // Initialize metrics
      await this.metrics.initialize();
      logger.info('Metrics collector initialized');

      logger.info('All services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      // Start API server
      await this.apiServer.start(config.apiPort);
      logger.info(`API Server running on port ${config.apiPort}`);

      // Start Gateway server (WebSocket)
      await this.gatewayServer.start(config.gatewayPort);
      logger.info(`Gateway Server running on port ${config.gatewayPort}`);

      // Start workers
      await this.workerManager.start();
      logger.info('Worker manager started');

      logger.info('NFT Marketplace Backend is fully operational');
    } catch (error) {
      logger.error('Failed to start services:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;

    logger.info('Shutting down NFT Marketplace Backend...');

    try {
      // Stop accepting new connections
      await this.gatewayServer.stop();
      await this.apiServer.stop();

      // Stop workers
      await this.workerManager.stop();

      // Close database connections
      await DatabaseManager.close();
      await RedisManager.close();
      await RabbitMQManager.close();

      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown(): void {
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.shutdown();
    });
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      this.shutdown();
    });
  }
}

// Main execution
async function main() {
  const app = new Application();
  app.setupGracefulShutdown();

  try {
    await app.initialize();
    await app.start();
  } catch (error) {
    logger.error('Application failed to start:', error);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  main();
}

export { Application };
