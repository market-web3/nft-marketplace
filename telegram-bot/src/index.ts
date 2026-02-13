/**
 * Telegram Bot for NFT Marketplace
 * Handles gift management and user linking
 */

import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { GiftService } from './services/gift.service';
import { UserService } from './services/user.service';
import { NotificationService } from './services/notification.service';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

const bot = new Telegraf(BOT_TOKEN);
const giftService = new GiftService();
const userService = new UserService();
const notificationService = new NotificationService(bot);

// Middleware
bot.use(async (ctx, next) => {
  const start = Date.now();
  logger.debug({
    updateId: ctx.update.update_id,
    from: ctx.from?.id,
    chat: ctx.chat?.id,
  }, 'Processing update');

  try {
    await next();
  } catch (error) {
    logger.error({
      error: (error as Error).message,
      updateId: ctx.update.update_id,
    }, 'Error processing update');
    
    await ctx.reply('An error occurred. Please try again later.');
  }

  logger.debug({
    updateId: ctx.update.update_id,
    duration: Date.now() - start,
  }, 'Update processed');
});

// Start command
bot.command('start', async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  // Register or update user
  await userService.registerUser({
    telegramId: user.id.toString(),
    telegramUsername: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
  });

  const welcomeMessage = `
🎉 Welcome to TON NFT Marketplace Bot!

I'm here to help you manage your NFTs and Telegram gifts. Here's what you can do:

📦 /inventory - View your NFT inventory
🎁 /gifts - View your Telegram gifts
💰 /deposit - Deposit a gift to marketplace
💸 /withdraw - Withdraw a gift to Telegram
🔗 /link - Link your website account
📊 /balance - Check your balance
❓ /help - Show help

Get started by linking your account or checking your inventory!
  `;

  await ctx.reply(welcomeMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🌐 Open Marketplace', url: process.env.FRONTEND_URL || 'https://example.com' },
          { text: '🔗 Link Account', callback_data: 'link_account' },
        ],
      ],
    },
  });
});

// Help command
bot.command('help', async (ctx) => {
  const helpMessage = `
📚 <b>Available Commands</b>

<b>NFT Management</b>
/inventory - View your NFTs
/activity - View your activity

<b>Gift Management</b>
/gifts - List your Telegram gifts
/deposit - Deposit a gift
/withdraw - Withdraw a gift

<b>Account</b>
/link - Link website account
/balance - Check balance
/profile - View profile
/settings - Bot settings

<b>Support</b>
/help - Show this help
/support - Contact support
  `;

  await ctx.reply(helpMessage, { parse_mode: 'HTML' });
});

// Inventory command
bot.command('inventory', async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  await ctx.reply('🔍 Fetching your inventory...');

  try {
    const inventory = await userService.getInventory(userId);
    
    if (inventory.length === 0) {
      await ctx.reply(
        '📭 Your inventory is empty.\n\nDeposit NFTs from the website or purchase from the marketplace!',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌐 Browse Marketplace', url: process.env.FRONTEND_URL || 'https://example.com' }],
            ],
          },
        }
      );
      return;
    }

    // Show first few items
    let message = '📦 <b>Your Inventory</b>\n\n';
    inventory.slice(0, 5).forEach((item: any, index: number) => {
      message += `${index + 1}. <b>${item.name}</b>\n`;
      message += `   Status: ${item.status}\n`;
      if (item.price) {
        message += `   Price: ${(item.price / 1e9).toFixed(2)} TON\n`;
      }
      message += '\n';
    });

    if (inventory.length > 5) {
      message += `...and ${inventory.length - 5} more items\n`;
    }

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'View Full Inventory', url: `${process.env.FRONTEND_URL}/inventory` }],
        ],
      },
    });
  } catch (error) {
    logger.error('Failed to fetch inventory:', error);
    await ctx.reply('❌ Failed to fetch inventory. Please try again later.');
  }
});

// Gifts command
bot.command('gifts', async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  await ctx.reply('🎁 Fetching your gifts...');

  try {
    const gifts = await giftService.getUserGifts(userId);

    if (gifts.length === 0) {
      await ctx.reply(
        '🎁 You don\'t have any gifts yet.\n\nGifts you receive will appear here!'
      );
      return;
    }

    let message = '🎁 <b>Your Telegram Gifts</b>\n\n';
    gifts.forEach((gift: any, index: number) => {
      message += `${index + 1}. <b>${gift.name}</b>\n`;
      message += `   Status: ${gift.status}\n`;
      message += `   Received: ${new Date(gift.deposited_at).toLocaleDateString()}\n\n`;
    });

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Deposit Gift', callback_data: 'deposit_gift' },
            { text: 'Withdraw Gift', callback_data: 'withdraw_gift' },
          ],
        ],
      },
    });
  } catch (error) {
    logger.error('Failed to fetch gifts:', error);
    await ctx.reply('❌ Failed to fetch gifts. Please try again later.');
  }
});

// Link account command
bot.command('link', async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  // Generate linking code
  const linkingCode = await userService.generateLinkingCode(userId);

  await ctx.reply(
    `🔗 <b>Link Your Account</b>\n\n` +
    `Use this code on the website to link your Telegram account:\n\n` +
    `<code>${linkingCode}</code>\n\n` +
    `Or click the button below:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ 
            text: '🔗 Link on Website', 
            url: `${process.env.FRONTEND_URL}/link-telegram?code=${linkingCode}` 
          }],
        ],
      },
    }
  );
});

// Balance command
bot.command('balance', async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  try {
    const balance = await userService.getBalance(userId);

    await ctx.reply(
      `💰 <b>Your Balance</b>\n\n` +
      `Available: ${(balance.available / 1e9).toFixed(2)} TON\n` +
      `Locked: ${(balance.locked / 1e9).toFixed(2)} TON\n` +
      `Total: ${((balance.available + balance.locked) / 1e9).toFixed(2)} TON\n\n` +
      `Use /withdraw to withdraw funds.`,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    logger.error('Failed to fetch balance:', error);
    await ctx.reply('❌ Failed to fetch balance. Please try again later.');
  }
});

// Handle callback queries
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  
  if (!data) return;

  switch (data) {
    case 'link_account':
      await ctx.answerCbQuery();
      await ctx.reply('Use /link to get your linking code!');
      break;
    
    case 'deposit_gift':
      await ctx.answerCbQuery();
      await ctx.reply(
        '🎁 To deposit a gift:\n\n' +
        '1. Forward the gift message to me\n' +
        '2. Or use the deposit feature on the website\n\n' +
        'Once deposited, you can list it for sale!'
      );
      break;
    
    case 'withdraw_gift':
      await ctx.answerCbQuery();
      await ctx.reply(
        '💸 To withdraw a gift:\n\n' +
        'Use the /withdraw command and follow the instructions.'
      );
      break;
    
    default:
      await ctx.answerCbQuery('Unknown action');
  }
});

// Handle incoming gifts (when users forward gift messages)
bot.on(message('text'), async (ctx) => {
  // Check if message contains a gift (simplified detection)
  const text = ctx.message.text;
  
  if (text.includes('Gift') || text.includes('🎁')) {
    await ctx.reply(
      '🎁 <b>Gift Detected!</b>\n\n' +
      'Would you like to deposit this gift to the marketplace?',
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Yes, Deposit', callback_data: 'confirm_deposit' },
              { text: '❌ No', callback_data: 'cancel_deposit' },
            ],
          ],
        },
      }
    );
  }
});

// Error handler
bot.catch((err, ctx) => {
  logger.error({
    error: err,
    ctx: ctx.update,
  }, 'Bot error');
});

// Start bot
export async function startBot() {
  logger.info('Starting Telegram bot...');
  
  // Set webhook in production
  if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_WEBHOOK_URL) {
    await bot.launch({
      webhook: {
        domain: process.env.TELEGRAM_WEBHOOK_URL,
        port: 3000,
      },
    });
    logger.info('Bot started with webhook');
  } else {
    await bot.launch();
    logger.info('Bot started with polling');
  }

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

// Start if run directly
if (require.main === module) {
  startBot().catch(console.error);
}

export { bot };
