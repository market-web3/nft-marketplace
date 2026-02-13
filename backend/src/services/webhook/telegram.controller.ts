/**
 * Telegram Webhook Controller
 */

import { Request, Response } from 'express';
import { DatabaseManager } from '../../shared/utils/database';
import { RedisManager } from '../../shared/utils/redis';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { WorkerManager } from '../../workers/manager';

export class TelegramWebhookController {
  private workerManager: WorkerManager;

  constructor() {
    this.workerManager = new WorkerManager();
  }

  // Handle incoming webhook from Telegram bot
  handleWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { event, data } = req.body;

    switch (event) {
      case 'gift_deposited':
        await this.handleGiftDeposited(data);
        break;
      case 'withdrawal_requested':
        await this.handleWithdrawalRequested(data);
        break;
      case 'gift_withdrawn':
        await this.handleGiftWithdrawn(data);
        break;
      case 'sync_completed':
        await this.handleSyncCompleted(data);
        break;
      default:
        console.log(`Unknown event: ${event}`);
    }

    res.json({ success: true });
  });

  private async handleGiftDeposited(data: any): Promise<void> {
    const { gift, source } = data;
    const db = DatabaseManager.getInstance();

    // Find user by Telegram ID
    const user = await db('users')
      .where('telegram_id', gift.telegramId)
      .first();

    if (user) {
      // Create offchain gift record
      await db('offchain_gifts').insert({
        user_id: user.id,
        telegram_gift_id: gift.id,
        name: gift.name,
        value: gift.value,
        status: 'deposited',
        source,
        created_at: new Date(),
      });

      // Send notification
      await this.workerManager.addJob('notifications', 'websocket', {
        userId: user.id,
        event: 'gift_deposited',
        payload: { gift },
      });
    }
  }

  private async handleWithdrawalRequested(data: any): Promise<void> {
    const { request, giftId } = data;
    const db = DatabaseManager.getInstance();

    // Update gift status
    await db('offchain_gifts')
      .where('telegram_gift_id', giftId)
      .update({
        status: 'pending_withdrawal',
        withdrawal_request_id: request.id,
        updated_at: new Date(),
      });

    // Notify admins
    await this.workerManager.addJob('notifications', 'websocket', {
      event: 'withdrawal_requested',
      payload: { request, giftId },
    });
  }

  private async handleGiftWithdrawn(data: any): Promise<void> {
    const { gift, recipientTelegramId } = data;
    const db = DatabaseManager.getInstance();

    // Update gift status
    await db('offchain_gifts')
      .where('telegram_gift_id', gift.id)
      .update({
        status: 'withdrawn',
        recipient_telegram_id: recipientTelegramId,
        withdrawn_at: new Date(),
      });
  }

  private async handleSyncCompleted(data: any): Promise<void> {
    console.log('Telegram sync completed:', data.timestamp);
  }

  // Get pending withdrawals for admin
  getPendingWithdrawals = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const db = DatabaseManager.getInstance();

    const withdrawals = await db('offchain_gifts')
      .where('status', 'pending_withdrawal')
      .leftJoin('users', 'offchain_gifts.user_id', 'users.id')
      .select(
        'offchain_gifts.*',
        'users.username as user_username',
        'users.telegram_id as user_telegram_id'
      )
      .orderBy('offchain_gifts.created_at', 'asc');

    res.json({
      success: true,
      data: { withdrawals },
    });
  });

  // Process withdrawal (admin)
  processWithdrawal = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const db = DatabaseManager.getInstance();

    const gift = await db('offchain_gifts').where('id', id).first();
    if (!gift) {
      res.status(404).json({ success: false, error: 'Gift not found' });
      return;
    }

    if (action === 'approve') {
      // Notify Telegram bot to send gift
      await RedisManager.getInstance().publish('telegram:send_gift', JSON.stringify({
        giftId: gift.telegram_gift_id,
        recipientTelegramId: gift.user_telegram_id,
      }));

      await db('offchain_gifts')
        .where('id', id)
        .update({ status: 'processing', updated_at: new Date() });
    } else {
      await db('offchain_gifts')
        .where('id', id)
        .update({ status: 'rejected', updated_at: new Date() });
    }

    res.json({ success: true, message: `Withdrawal ${action}ed` });
  });
}
