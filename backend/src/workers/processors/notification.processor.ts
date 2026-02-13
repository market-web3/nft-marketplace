/**
 * Notification Processor
 * Sends notifications to users
 */

import { Job } from 'bullmq';
import { logger } from '../../shared/utils/logger';
import { DatabaseManager } from '../../shared/utils/database';
import { RedisManager } from '../../shared/utils/redis';

interface NotificationJob {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: ('in_app' | 'email' | 'telegram')[];
}

export async function processNotification(job: Job<NotificationJob>): Promise<void> {
  const { userId, type, title, message, data, channels } = job.data;

  logger.debug({
    jobId: job.id,
    userId,
    type,
    channels,
  }, 'Processing notification');

  const db = DatabaseManager.getInstance();

  try {
    // Save notification to database
    const [notification] = await db('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: JSON.stringify(data),
        channels: JSON.stringify(channels),
        status: 'pending',
      })
      .returning('*');

    // Process each channel
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'in_app':
            await sendInAppNotification(userId, notification);
            break;
          case 'telegram':
            await sendTelegramNotification(userId, title, message, data);
            break;
          case 'email':
            await sendEmailNotification(userId, title, message, data);
            break;
        }
      } catch (error) {
        logger.error({
          notificationId: notification.id,
          channel,
          error: (error as Error).message,
        }, 'Failed to send notification via channel');
      }
    }

    // Update notification status
    await db('notifications')
      .where('id', notification.id)
      .update({ status: 'sent' });

    logger.info({
      jobId: job.id,
      notificationId: notification.id,
    }, 'Notification processed');

  } catch (error) {
    logger.error({
      jobId: job.id,
      error: (error as Error).message,
    }, 'Notification processing failed');
    throw error;
  }
}

async function sendInAppNotification(userId: string, notification: any): Promise<void> {
  // Publish to WebSocket for real-time delivery
  await RedisManager.publish('marketplace:events', JSON.stringify({
    type: 'notification',
    target: userId,
    data: {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      createdAt: notification.created_at,
    },
  }));
}

async function sendTelegramNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<void> {
  const db = DatabaseManager.getInstance();
  
  // Get user's Telegram info
  const user = await db('users')
    .select('telegram_id')
    .where('id', userId)
    .first();

  if (!user?.telegram_id) {
    logger.debug(`User ${userId} has no Telegram linked`);
    return;
  }

  // Queue Telegram message (processed by Telegram bot)
  await RedisManager.lpush('telegram:messages', JSON.stringify({
    chatId: user.telegram_id,
    text: `*${title}*\n\n${message}`,
    parseMode: 'Markdown',
  }));
}

async function sendEmailNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<void> {
  // Queue email for sending
  await RedisManager.lpush('email:queue', JSON.stringify({
    userId,
    subject: title,
    body: message,
  }));
}
