import { Redis } from 'ioredis';
import TelegramBot from 'node-telegram-bot-api';

export class WebhookHandler {
  private redis: Redis;
  private bot: TelegramBot;

  constructor(redis: Redis, bot: TelegramBot) {
    this.redis = redis;
    this.bot = bot;
  }

  async handleWebhook(payload: any): Promise<void> {
    const { event, data } = payload;

    switch (event) {
      case 'gift_deposited':
        await this.handleGiftDeposited(data);
        break;
      case 'gift_withdrawn':
        await this.handleGiftWithdrawn(data);
        break;
      case 'withdrawal_requested':
        await this.handleWithdrawalRequested(data);
        break;
      case 'nft_sold':
        await this.handleNFTSold(data);
        break;
      case 'auction_won':
        await this.handleAuctionWon(data);
        break;
      case 'offer_accepted':
        await this.handleOfferAccepted(data);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
  }

  private async handleGiftDeposited(data: any): Promise<void> {
    const { gift, source } = data;
    console.log(`Gift deposited from ${source}:`, gift);
    
    // Notify user about successful deposit
    await this.bot.sendMessage(
      parseInt(gift.telegramId),
      `✅ Your gift "${gift.name}" has been deposited to your inventory!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📦 View Inventory', url: `${process.env.FRONTEND_URL}/inventory` }],
          ],
        },
      }
    );
  }

  private async handleGiftWithdrawn(data: any): Promise<void> {
    const { gift, recipientTelegramId } = data;
    console.log('Gift withdrawn:', gift);
  }

  private async handleWithdrawalRequested(data: any): Promise<void> {
    const { request, giftId } = data;
    console.log('Withdrawal requested:', request);
    
    // Notify user about pending withdrawal
    await this.bot.sendMessage(
      parseInt(request.telegramId),
      '⏳ Your withdrawal request is being processed. You will receive your gift shortly.'
    );
  }

  private async handleNFTSold(data: any): Promise<void> {
    const { seller, buyer, nft, price } = data;
    
    // Notify seller
    await this.bot.sendMessage(
      parseInt(seller),
      `🎉 Your NFT "${nft.name}" was sold for ${price} TON!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 View Balance', url: `${process.env.FRONTEND_URL}/profile` }],
          ],
        },
      }
    );

    // Notify buyer
    await this.bot.sendMessage(
      parseInt(buyer),
      `✅ You successfully purchased "${nft.name}" for ${price} TON!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📦 View Inventory', url: `${process.env.FRONTEND_URL}/inventory` }],
          ],
        },
      }
    );
  }

  private async handleAuctionWon(data: any): Promise<void> {
    const { winner, auction, bid } = data;
    
    await this.bot.sendMessage(
      parseInt(winner),
      `🏆 Congratulations! You won the auction for "${auction.name}" with a bid of ${bid} TON!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📦 View Item', url: `${process.env.FRONTEND_URL}/inventory` }],
          ],
        },
      }
    );
  }

  private async handleOfferAccepted(data: any): Promise<void> {
    const { buyer, seller, nft, offerAmount } = data;
    
    // Notify buyer
    await this.bot.sendMessage(
      parseInt(buyer),
      `✅ Your offer of ${offerAmount} TON for "${nft.name}" was accepted!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📦 View Item', url: `${process.env.FRONTEND_URL}/inventory` }],
          ],
        },
      }
    );

    // Notify seller
    await this.bot.sendMessage(
      parseInt(seller),
      `💰 You accepted an offer of ${offerAmount} TON for "${nft.name}"!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 View Balance', url: `${process.env.FRONTEND_URL}/profile` }],
          ],
        },
      }
    );
  }
}
