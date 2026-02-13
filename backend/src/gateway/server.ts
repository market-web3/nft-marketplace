/**
 * WebSocket Gateway Server
 * Real-time updates for the NFT Marketplace
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../shared/config/env';
import { logger } from '../shared/utils/logger';
import { RedisManager } from '../shared/utils/redis';
import { authenticateSocket } from '../shared/middleware/authenticate';

export class GatewayServer {
  private io: SocketIOServer | null = null;
  private httpServer: HTTPServer | null = null;

  async start(port: number): Promise<void> {
    this.httpServer = new HTTPServer();
    
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: config.NODE_ENV === 'production' 
          ? process.env.ALLOWED_ORIGINS?.split(',') || []
          : '*',
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    return new Promise((resolve) => {
      this.httpServer?.listen(port, () => {
        logger.info(`WebSocket Gateway started on port ${port}`);
        resolve();
      });
    });
  }

  private setupMiddleware(): void {
    this.io?.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (token) {
          const user = await authenticateSocket(token);
          socket.data.user = user;
        }
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io?.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Join user-specific room if authenticated
      if (socket.data.user?.id) {
        socket.join(`user:${socket.data.user.id}`);
      }

      // Subscribe to global events
      socket.join('global');

      // Handle subscription requests
      socket.on('subscribe', (channel: string) => {
        socket.join(channel);
        socket.emit('subscribed', { channel });
      });

      socket.on('unsubscribe', (channel: string) => {
        socket.leave(channel);
        socket.emit('unsubscribed', { channel });
      });

      // Handle ping
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    // Subscribe to Redis events and broadcast
    this.setupRedisSubscription();
  }

  private setupRedisSubscription(): void {
    // Subscribe to various channels
    const channels = [
      'nft:listed',
      'nft:sold',
      'auction:bid',
      'auction:ended',
      'offer:made',
      'offer:accepted',
      'gift:deposited',
      'gift:withdrawn',
    ];

    channels.forEach((channel) => {
      RedisManager.subscribe(channel, (message) => {
        this.broadcast(channel, JSON.parse(message));
      });
    });
  }

  broadcast(event: string, data: any, room?: string): void {
    if (room) {
      this.io?.to(room).emit(event, data);
    } else {
      this.io?.emit(event, data);
    }
  }

  broadcastToUser(userId: string, event: string, data: any): void {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.io?.close(() => {
        logger.info('WebSocket Gateway stopped');
        resolve();
      });
    });
  }
}
