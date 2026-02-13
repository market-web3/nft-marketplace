/**
 * WebSocket Gateway Server
 * Handles real-time updates and notifications
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../shared/config/env';
import { logger } from '../shared/utils/logger';
import { RedisManager } from '../shared/utils/redis';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  walletAddress?: string;
}

export class GatewayServer {
  private io: SocketIOServer | null = null;
  private httpServer: HTTPServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds

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
    this.setupRedisSubscription();

    return new Promise((resolve) => {
      this.httpServer!.listen(port, () => {
        logger.info(`Gateway Server started on port ${port}`);
        resolve();
      });
    });
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token as string;
        
        if (!token) {
          // Allow connection without auth for public events
          return next();
        }

        const decoded = jwt.verify(token, config.JWT_SECRET) as {
          userId: string;
          walletAddress: string;
        };

        socket.userId = decoded.userId;
        socket.walletAddress = decoded.walletAddress;

        // Track user socket
        if (!this.userSockets.has(decoded.userId)) {
          this.userSockets.set(decoded.userId, new Set());
        }
        this.userSockets.get(decoded.userId)!.add(socket.id);

        next();
      } catch (error) {
        logger.warn('Socket auth failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.debug(`Client connected: ${socket.id} (user: ${socket.userId || 'anonymous'})`);

      // Join user-specific room if authenticated
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
      }

      // Handle subscription to events
      socket.on('subscribe', (channels: string[]) => {
        channels.forEach(channel => {
          socket.join(channel);
          logger.debug(`Socket ${socket.id} subscribed to ${channel}`);
        });
      });

      socket.on('unsubscribe', (channels: string[]) => {
        channels.forEach(channel => {
          socket.leave(channel);
          logger.debug(`Socket ${socket.id} unsubscribed from ${channel}`);
        });
      });

      // Handle ping
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.debug(`Client disconnected: ${socket.id}`);
        
        if (socket.userId) {
          const userSocketSet = this.userSockets.get(socket.userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(socket.userId);
            }
          }
        }
      });
    });
  }

  private setupRedisSubscription(): void {
    // Subscribe to Redis pub/sub for cross-server events
    const subscriber = RedisManager.getInstance().duplicate();
    
    subscriber.subscribe('marketplace:events', (err) => {
      if (err) {
        logger.error('Failed to subscribe to Redis channel:', err);
      } else {
        logger.info('Subscribed to marketplace events channel');
      }
    });

    subscriber.on('message', (channel, message) => {
      if (channel === 'marketplace:events') {
        try {
          const event = JSON.parse(message);
          this.broadcastEvent(event);
        } catch (error) {
          logger.error('Failed to parse Redis message:', error);
        }
      }
    });
  }

  private broadcastEvent(event: { type: string; data: any; target?: string }): void {
    if (!this.io) return;

    switch (event.type) {
      case 'nft:list':
        this.io.to('marketplace').emit('nft:list', event.data);
        break;
      case 'nft:sold':
        this.io.to('marketplace').emit('nft:sold', event.data);
        // Also notify specific users
        if (event.data.sellerId) {
          this.io.to(`user:${event.data.sellerId}`).emit('nft:sold', event.data);
        }
        if (event.data.buyerId) {
          this.io.to(`user:${event.data.buyerId}`).emit('nft:purchased', event.data);
        }
        break;
      case 'auction:bid':
        this.io.to(`auction:${event.data.auctionId}`).emit('auction:bid', event.data);
        break;
      case 'auction:end':
        this.io.to('marketplace').emit('auction:end', event.data);
        break;
      case 'offer:created':
        if (event.data.sellerId) {
          this.io.to(`user:${event.data.sellerId}`).emit('offer:received', event.data);
        }
        break;
      case 'offer:accepted':
        if (event.data.buyerId) {
          this.io.to(`user:${event.data.buyerId}`).emit('offer:accepted', event.data);
        }
        break;
      case 'notification':
        if (event.target) {
          this.io.to(`user:${event.target}`).emit('notification', event.data);
        }
        break;
      default:
        this.io.emit(event.type, event.data);
    }
  }

  // Public methods for emitting events
  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  emitToAll(event: string, data: any): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  emitToRoom(room: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(room).emit(event, data);
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.io) {
        this.io.close((err) => {
          if (err) {
            logger.error('Error closing Socket.IO:', err);
            reject(err);
          } else {
            logger.info('Socket.IO server closed');
            resolve();
          }
        });
      } else if (this.httpServer) {
        this.httpServer.close((err) => {
          if (err) {
            reject(err);
          } else {
            logger.info('Gateway server closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}
