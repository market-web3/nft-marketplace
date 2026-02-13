/**
 * Metrics Collector
 * Prometheus metrics for monitoring
 */

import { register, Counter, Histogram, Gauge } from 'prom-client';
import { logger } from './logger';

export class MetricsCollector {
  private httpRequestDuration: Histogram;
  private httpRequestsTotal: Counter;
  private activeConnections: Gauge;
  private dbQueryDuration: Histogram;
  private blockchainOperations: Counter;

  constructor() {
    // HTTP request duration
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    // Total HTTP requests
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    // Active WebSocket connections
    this.activeConnections = new Gauge({
      name: 'active_websocket_connections',
      help: 'Number of active WebSocket connections',
    });

    // Database query duration
    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    // Blockchain operations
    this.blockchainOperations = new Counter({
      name: 'blockchain_operations_total',
      help: 'Total number of blockchain operations',
      labelNames: ['operation', 'status'],
    });

    // Register metrics
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.activeConnections);
    register.registerMetric(this.dbQueryDuration);
    register.registerMetric(this.blockchainOperations);
  }

  async initialize(): Promise<void> {
    logger.info('Metrics collector initialized');
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }

  setActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  recordDbQuery(operation: string, table: string, duration: number): void {
    this.dbQueryDuration.observe({ operation, table }, duration);
  }

  recordBlockchainOperation(operation: string, status: string): void {
    this.blockchainOperations.inc({ operation, status });
  }

  getMetrics(): Promise<string> {
    return register.metrics();
  }
}
