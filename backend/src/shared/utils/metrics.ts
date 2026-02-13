/**
 * Metrics Collector
 * Prometheus metrics for monitoring
 */

import { register, Counter, Histogram, Gauge } from 'prom-client';
import { createServer } from 'http';
import { logger } from './logger';
import { config } from '../config/env';

export class MetricsCollector {
  private httpServer: ReturnType<typeof createServer> | null = null;

  // Counters
  public httpRequestsTotal: Counter;
  public transactionsTotal: Counter;
  public websocketConnectionsTotal: Counter;

  // Histograms
  public httpRequestDuration: Histogram;
  public transactionConfirmationDuration: Histogram;
  public databaseQueryDuration: Histogram;

  // Gauges
  public activeConnections: Gauge;
  public activeListings: Gauge;
  public queueSize: Gauge;

  constructor() {
    // HTTP requests counter
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    // Transactions counter
    this.transactionsTotal = new Counter({
      name: 'nft_transactions_total',
      help: 'Total NFT transactions',
      labelNames: ['type', 'status'],
    });

    // WebSocket connections counter
    this.websocketConnectionsTotal = new Counter({
      name: 'websocket_connections_total',
      help: 'Total WebSocket connections',
      labelNames: ['event'],
    });

    // HTTP request duration histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    // Transaction confirmation duration
    this.transactionConfirmationDuration = new Histogram({
      name: 'transaction_confirmation_duration_seconds',
      help: 'Transaction confirmation duration in seconds',
      labelNames: ['type'],
      buckets: [5, 10, 30, 60, 120, 300],
    });

    // Database query duration
    this.databaseQueryDuration = new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
    });

    // Active connections gauge
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['type'],
    });

    // Active listings gauge
    this.activeListings = new Gauge({
      name: 'active_listings',
      help: 'Number of active NFT listings',
      labelNames: ['type'],
    });

    // Queue size gauge
    this.queueSize = new Gauge({
      name: 'queue_size',
      help: 'Size of processing queues',
      labelNames: ['queue'],
    });
  }

  async initialize(): Promise<void> {
    const port = parseInt(config.METRICS_PORT as unknown as string, 10) || 9090;

    this.httpServer = createServer(async (req, res) => {
      if (req.url === '/metrics') {
        res.setHeader('Content-Type', register.contentType);
        res.end(await register.metrics());
      } else {
        res.statusCode = 404;
        res.end('Not Found');
      }
    });

    return new Promise((resolve) => {
      this.httpServer!.listen(port, () => {
        logger.info(`Metrics server started on port ${port}`);
        resolve();
      });
    });
  }

  recordHttpRequest(method: string, route: string, statusCode: number, durationMs: number): void {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
    this.httpRequestDuration.observe({ method, route }, durationMs / 1000);
  }

  recordTransaction(type: string, status: string): void {
    this.transactionsTotal.inc({ type, status });
  }

  recordDbQuery(operation: string, table: string, durationMs: number): void {
    this.databaseQueryDuration.observe({ operation, table }, durationMs / 1000);
  }

  setActiveConnections(type: string, count: number): void {
    this.activeConnections.set({ type }, count);
  }

  setActiveListings(type: string, count: number): void {
    this.activeListings.set({ type }, count);
  }

  setQueueSize(queue: string, size: number): void {
    this.queueSize.set({ queue }, size);
  }

  incrementWebsocketConnections(event: string): void {
    this.websocketConnectionsTotal.inc({ event });
  }

  async close(): Promise<void> {
    if (this.httpServer) {
      return new Promise((resolve, reject) => {
        this.httpServer!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
}
