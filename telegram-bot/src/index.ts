import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import { Redis } from 'ioredis';
import pino from 'pino';
import { GiftManager } from './services/GiftManager';
import { UserManager } from './services/UserManager';
import { WebhookHandler } from './services/WebhookHandler';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

const app = express();
app.use(express.json());

// Initialize Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Initialize Bot
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  logger.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const giftManager = new GiftManager(redis, bot);
const userManager = new UserManager(redis);
const webhookHandler = new WebhookHandler(redis, bot);

// Bot Commands
bot.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'help', description: 'Show help information' },
  { command: 'inventory', description: 'View your NFT inventory' },
  { command: 'deposit', description: 'Deposit a Telegram gift' },
  { command: 'withdraw', description: 'Withdraw a gift to Telegram' },
  { command: 'link', description: 'Link your website account' },
  { command: 'balance', description: 'Check your balance' },
]);

// Start Command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from?.username || 'User';
  
  await userManager.registerUser({
    telegramId: chatId.toString(),
    username: msg.from?.username,
    firstName: msg.from?.first_name,
    lastName: msg.from?.last_name,
  });

  const welcomeMessage = `
🎉 Welcome to <b>TON NFT Marketplace Bot</b>, ${username}!

I can help you manage your NFTs and Telegram gifts:

📦 <b>Deposit</b> - Send gifts from Telegram to your inventory
🎁 <b>Withdraw</b> - Send gifts back to Telegram
💼 <b>Inventory</b> - View all your NFTs
🔗 <b>Link</b> - Connect with your website account

Use /help to see all available commands.
  `;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
});

// Help Command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
📚 <b>Available Commands:</b>

/start - Start the bot
/help - Show this help message
/inventory - View your NFT inventory
/deposit - Deposit a Telegram gift
/withdraw - Withdraw a gift to Telegram
/link - Link your website account
/balance - Check your balance

💡 <b>Quick Tips:</b>
• Send a gift to deposit it
• Use /withdraw to get gifts back
• Link your account for full features
  `;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
});

// Inventory Command
bot.onText(/\/inventory/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const gifts = await giftManager.getUserGifts(chatId.toString());
    
    if (gifts.length === 0) {
      bot.sendMessage(chatId, '📭 Your inventory is empty. Send me a gift to deposit it!');
      return;
    }

    let message = '📦 <b>Your Inventory:</b>\n\n';
    gifts.forEach((gift, index) => {
      message += `${index + 1}. <b>${gift.name}</b>\n`;
      message += `   Status: ${gift.status}\n`;
      message += `   Value: ${gift.value} TON\n\n`;
    });

    const keyboard = {
      inline_keyboard: [
        [{ text: '🌐 View on Website', url: `${process.env.FRONTEND_URL}/inventory` }],
        [{ text: '⬆️ Withdraw Gift', callback_data: 'withdraw_menu' }],
      ],
    };

    bot.sendMessage(chatId, message, { 
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch (error) {
    logger.error('Error fetching inventory:', error);
    bot.sendMessage(chatId, '❌ Error fetching inventory. Please try again.');
  }
});

// Deposit Command
bot.onText(/\/deposit/, (msg) => {
  const chatId = msg.chat.id;
  
  const message = `
📥 <b>Deposit a Gift</b>

To deposit a Telegram gift to your inventory:

1. Open any chat in Telegram
2. Tap the attachment button (📎)
3. Select "Gift"
4. Choose a gift and send it to me

The gift will be automatically added to your inventory!
  `;

  bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
});

// Withdraw Command
bot.onText(/\/withdraw/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const gifts = await giftManager.getUserGifts(chatId.toString());
    const availableGifts = gifts.filter(g => g.status === 'deposited');
    
    if (availableGifts.length === 0) {
      bot.sendMessage(chatId, '❌ You have no gifts available for withdrawal.');
      return;
    }

    const keyboard = {
      inline_keyboard: availableGifts.map((gift, index) => [
        { text: `${index + 1}. ${gift.name}`, callback_data: `withdraw:${gift.id}` }
      ]),
    };

    bot.sendMessage(chatId, '🎁 Select a gift to withdraw:', {
      reply_markup: keyboard,
    });
  } catch (error) {
    logger.error('Error in withdraw:', error);
    bot.sendMessage(chatId, '❌ Error processing request. Please try again.');
  }
});

// Link Account Command
bot.onText(/\/link/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const linkingCode = await userManager.generateLinkingCode(chatId.toString());
    
    const message = `
🔗 <b>Link Your Account</b>

To link your Telegram with the website:

1. Go to your <a href="${process.env.FRONTEND_URL}/profile">Profile</a>
2. Click "Link Telegram"
3. Enter this code: <code>${linkingCode}</code>

Or click the button below to link automatically:
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🔗 Link Account', url: `${process.env.FRONTEND_URL}/link-telegram?code=${linkingCode}` }],
      ],
    };

    bot.sendMessage(chatId, message, { 
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch (error) {
    logger.error('Error generating linking code:', error);
    bot.sendMessage(chatId, '❌ Error generating linking code. Please try again.');
  }
});

// Balance Command
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const balance = await userManager.getBalance(chatId.toString());
    const gifts = await giftManager.getUserGifts(chatId.toString());
    
    const message = `
💰 <b>Your Balance</b>

TON Balance: <b>${balance.ton} TON</b>
NFTs Owned: <b>${balance.nftCount}</b>
Gifts Deposited: <b>${gifts.filter(g => g.status === 'deposited').length}</b>

View full details on the website:
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🌐 View Profile', url: `${process.env.FRONTEND_URL}/profile` }],
      ],
    };

    bot.sendMessage(chatId, message, { 
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch (error) {
    logger.error('Error fetching balance:', error);
    bot.sendMessage(chatId, '❌ Error fetching balance. Please try again.');
  }
});

// Handle Callback Queries
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  const data = query.data;

  if (!chatId || !data) return;

  if (data.startsWith('withdraw:')) {
    const giftId = data.split(':')[1];
    
    try {
      // Create withdrawal request
      await giftManager.createWithdrawalRequest({
        giftId,
        telegramId: chatId.toString(),
        status: 'pending',
      });

      bot.editMessageText(
        '✅ Withdrawal request created!\n\nYour gift will be sent to you shortly. You can check the status on the website.',
        {
          chat_id: chatId,
          message_id: query.message?.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌐 View Status', url: `${process.env.FRONTEND_URL}/inventory` }],
            ],
          },
        }
      );
    } catch (error) {
      logger.error('Error creating withdrawal:', error);
      bot.answerCallbackQuery(query.id, { text: 'Error processing withdrawal' });
    }
  }

  bot.answerCallbackQuery(query.id);
});

// Handle Incoming Gifts (Web App Data or regular messages)
bot.on('message', async (msg) => {
  // Check if message contains a gift (via WebApp or forwarded)
  if (msg.web_app_data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      
      if (data.type === 'gift_deposit') {
        await giftManager.depositGift({
          telegramId: msg.chat.id.toString(),
          giftData: data.gift,
          source: 'webapp',
        });

        bot.sendMessage(
          msg.chat.id,
          `✅ <b>Gift Deposited Successfully!</b>\n\nName: ${data.gift.name}\nValue: ${data.gift.value} TON\n\nView it in your inventory on the website.`,
          { parse_mode: 'HTML' }
        );
      }
    } catch (error) {
      logger.error('Error processing webapp data:', error);
    }
  }
});

// API Routes for Admin Panel
app.post('/api/gifts/send', async (req, res) => {
  try {
    const { giftId, recipientTelegramId } = req.body;
    
    const result = await giftManager.sendGiftToUser(giftId, recipientTelegramId);
    
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Error sending gift:', error);
    res.status(500).json({ success: false, error: 'Failed to send gift' });
  }
});

app.get('/api/gifts/pending', async (req, res) => {
  try {
    const pending = await giftManager.getPendingWithdrawals();
    res.json({ success: true, data: pending });
  } catch (error) {
    logger.error('Error fetching pending gifts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending gifts' });
  }
});

app.post('/api/sync', async (req, res) => {
  try {
    await giftManager.syncWithTelegram();
    res.json({ success: true, message: 'Sync completed' });
  } catch (error) {
    logger.error('Error syncing:', error);
    res.status(500).json({ success: false, error: 'Sync failed' });
  }
});

// Start Server
const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  logger.info(`Telegram Bot API server running on port ${PORT}`);
});

logger.info('Telegram Bot started successfully');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await redis.quit();
  process.exit(0);
});
