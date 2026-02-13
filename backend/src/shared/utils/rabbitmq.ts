/**
 * RabbitMQ Manager
 * Message queue for inter-service communication
 */

import amqp, { Connection, Channel } from 'amqplib';
import { config } from '../config/env';
import { logger } from './logger';

export class RabbitMQManager {
  private static connection: Connection | null = null;
  private static channel: Channel | null = null;

  static async initialize(): Promise<void> {
    try {
      this.connection = await amqp.connect(config.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // Assert exchanges
      await this.channel.assertExchange('marketplace.events', 'topic', { durable: true });
      await this.channel.assertExchange('marketplace.delayed', 'x-delayed-message', {
        durable: true,
        arguments: { 'x-delayed-type': 'topic' },
      });

      // Assert queues
      await this.channel.assertQueue('notifications', { durable: true });
      await this.channel.assertQueue('transactions', { durable: true });
      await this.channel.assertQueue('webhooks', { durable: true });

      // Bind queues
      await this.channel.bindQueue('notifications', 'marketplace.events', 'notification.*');
      await this.channel.bindQueue('transactions', 'marketplace.events', 'transaction.*');

      // Setup error handlers
      this.connection.on('error', (error) => {
        logger.error('RabbitMQ connection error:', error);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
      });

      logger.info('RabbitMQ connection established');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  static getChannel(): Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ not initialized');
    }
    return this.channel;
  }

  static async publish(exchange: string, routingKey: string, message: any): Promise<void> {
    const channel = this.getChannel();
    const buffer = Buffer.from(JSON.stringify(message));
    
    channel.publish(exchange, routingKey, buffer, {
      persistent: true,
      timestamp: Date.now(),
    });
  }

  static async sendToQueue(queue: string, message: any, delay?: number): Promise<void> {
    const channel = this.getChannel();
    const buffer = Buffer.from(JSON.stringify(message));

    const options: any = {
      persistent: true,
      timestamp: Date.now(),
    };

    if (delay) {
      options.headers = { 'x-delay': delay };
    }

    channel.sendToQueue(queue, buffer, options);
  }

  static async consume(
    queue: string,
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    const channel = this.getChannel();

    await channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        await handler(content);
        channel.ack(msg);
      } catch (error) {
        logger.error('Message processing failed:', error);
        channel.nack(msg, false, false); // Don't requeue
      }
    });
  }

  static async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    logger.info('RabbitMQ connection closed');
  }
}
