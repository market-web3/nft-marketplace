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
      await this.channel.assertExchange('nft.events', 'topic', { durable: true });
      await this.channel.assertExchange('nft.commands', 'direct', { durable: true });

      // Assert queues
      await this.channel.assertQueue('transaction.processing', { durable: true });
      await this.channel.assertQueue('notification.send', { durable: true });
      await this.channel.assertQueue('auction.monitor', { durable: true });

      // Bind queues
      await this.channel.bindQueue('transaction.processing', 'nft.events', 'transaction.*');
      await this.channel.bindQueue('notification.send', 'nft.events', 'notification.*');
      await this.channel.bindQueue('auction.monitor', 'nft.events', 'auction.*');

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
    channel.publish(exchange, routingKey, buffer, { persistent: true });
  }

  static async sendToQueue(queue: string, message: any): Promise<void> {
    const channel = this.getChannel();
    const buffer = Buffer.from(JSON.stringify(message));
    channel.sendToQueue(queue, buffer, { persistent: true });
  }

  static async consume(queue: string, handler: (message: any) => Promise<void>): Promise<void> {
    const channel = this.getChannel();
    await channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          channel.ack(msg);
        } catch (error) {
          logger.error(`Error processing message from ${queue}:`, error);
          channel.nack(msg, false, true);
        }
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
