/**
 * Notification Service
 * Sends notifications to Telegram users
 */

import { Telegraf } from 'telegraf';
import { logger } from '../utils/logger';

export class NotificationService {
  constructor(private bot: Telegraf) {}

  async notifySale(telegramId: string, data: {
    nftName: string;
    price: number;
    buyerUsername?: string;
  }): Promise<void> {
    const message = `
🎉 <b>Sale Completed!</b>

Your NFT "${data.nftName}" has been sold for ${(data.price / 1e9).toFixed(2)} TON!
${data.buyerUsername ? `Buyer: @${data.buyerUsername}` : ''}

The funds have been added to your balance.
    `;

    await this.sendMessage(telegramId, message);
  }

  async notifyPurchase(telegramId: string, data: {
    nftName: string;
    price: number;
    sellerUsername?: string;
  }): Promise<void> {
    const message = `
🎊 <b>Purchase Successful!</b>

You successfully purchased "${data.nftName}" for ${(data.price / 1e9).toFixed(2)} TON!
${data.sellerUsername ? `Seller: @${data.sellerUsername}` : ''}

The NFT is now in your inventory.
    `;

    await this.sendMessage(telegramId, message);
  }

  async notifyOffer(telegramId: string, data: {
    nftName: string;
    amount: number;
    buyerUsername?: string;
    expiresAt: Date;
  }): Promise<void> {
    const message = `
💰 <b>New Offer Received!</b>

Someone offered ${(data.amount / 1e9).toFixed(2)} TON for your NFT "${data.nftName}"!
${data.buyerUsername ? `Buyer: @${data.buyerUsername}` : ''}

Offer expires: ${data.expiresAt.toLocaleDateString()}

Accept or reject this offer on the website.
    `;

    await this.sendMessage(telegramId, message);
  }

  async notifyAuctionEnd(telegramId: string, data: {
    nftName: string;
    finalPrice: number;
    won: boolean;
  }): Promise<void> {
    const message = data.won
      ? `
🏆 <b>Auction Won!</b>

Congratulations! You won the auction for "${data.nftName}" with a bid of ${(data.finalPrice / 1e9).toFixed(2)} TON!

The NFT is now in your inventory.
      `
      : `
📢 <b>Auction Ended</b>

Your auction for "${data.nftName}" has ended with a final price of ${(data.finalPrice / 1e9).toFixed(2)} TON.

The funds have been added to your balance.
      `;

    await this.sendMessage(telegramId, message);
  }

  async notifyOutbid(telegramId: string, data: {
    nftName: string;
    yourBid: number;
    newBid: number;
  }): Promise<void> {
    const message = `
⚠️ <b>You've Been Outbid!</b>

Someone placed a higher bid on "${data.nftName}".

Your bid: ${(data.yourBid / 1e9).toFixed(2)} TON
New bid: ${(data.newBid / 1e9).toFixed(2)} TON

Place a higher bid to stay in the lead!
    `;

    await this.sendMessage(telegramId, message);
  }

  async notifyGiftReceived(telegramId: string, data: {
    giftName: string;
    fromUsername?: string;
  }): Promise<void> {
    const message = `
🎁 <b>New Gift Received!</b>

You received "${data.giftName}"!
${data.fromUsername ? `From: @${data.fromUsername}` : ''}

View your gifts with /gifts or deposit it to the marketplace.
    `;

    await this.sendMessage(telegramId, message);
  }

  private async sendMessage(telegramId: string, message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      logger.error({
        telegramId,
        error: (error as Error).message,
      }, 'Failed to send notification');
    }
  }
}
