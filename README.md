# TON NFT Marketplace - Complete System

A production-ready, full-featured NFT marketplace built on The Open Network (TON) blockchain with enhanced auction system, offer management, Telegram integration, and upgradeable smart contracts.

## 🚀 Features

### Smart Contracts (FunC) - UPGRADEABLE
- **Proxy Pattern**: Contract address never changes during upgrades
- **Main Marketplace Contract V4** (`nft_marketplace_upgradeable.fc`)
  - Admin wallet direct approval - no admin panel dependency in contract
  - **Enhanced Auction System**: Configurable duration (7 days to 1 year)
  - **Enhanced Offer System**: Time-limited offers (1 hour to 30 days)
  - Automatic TON handling for offers (lock, release on accept/reject/expiry)
  - Automatic offer cancellation on expiry
  - Fixed price listings
  - NFT deposit/withdrawal
  - Virtual balance support
  - **Security Features**:
    - Emergency pause/unpause
    - Admin transfer capability
    - Emergency withdrawal
    - Version tracking

### Backend (Node.js/TypeScript)
- Microservices architecture
- Real-time updates via WebSocket
- Redis caching
- PostgreSQL database
- Anti double-spend protection
- Rate limiting
- RabbitMQ message queue
- Background job processing with BullMQ

### Frontend (Next.js/React)
- **Wallet Integration**: TonConnect support
- **Home Page**: Animated hero, stats, categories, featured NFTs, trending auctions
- **Market Page**: Search, filters, sorting, grid/list view
- **Inventory Page**: NFTs, deposited items, Telegram gifts
- **Profile Page**: Stats, created/owned NFTs, activity history, Telegram connection
- **Telegram Integration**: Connect Telegram account, receive notifications
- **Responsive Design**: Mobile, tablet, desktop optimized
- **Dark Mode**: Full dark mode support

### Admin Panel (React + Vite)
- **Dashboard**: Statistics, charts, recent activity
- **NFT Management**: Approve/reject NFTs, view all listings
- **Auction Management**: Create, start, end auctions
- **Offers Management**: Monitor and manage offers
- **Telegram Gifts**: Sync with Telegram, manage withdrawals, send gifts
- **User Management**: View, ban/unban users
- **Settings**: Configure marketplace, wallets, Telegram

### Telegram Bot (Node.js)
- **Gift Management**: Deposit and withdraw Telegram gifts
- **User Linking**: Link Telegram to website account
- **Inventory**: View NFTs via bot
- **Withdrawal Requests**: Handle gift withdrawal to Telegram
- **Notifications**: Real-time notifications for sales, auctions, offers

## 📁 Project Structure

```
nft-marketplace/
├── smart-contracts/          # TON FunC contracts
│   ├── contracts/
│   │   ├── proxy.fc                     # Upgradeable proxy contract
│   │   ├── nft_marketplace_upgradeable.fc # Implementation contract
│   │   ├── nft_marketplace_v3.fc        # Legacy V3 (for reference)
│   │   ├── auction.fc                   # Auction contract
│   │   ├── op_codes.fc                  # Operation codes
│   │   ├── errors.fc                    # Error codes
│   │   └── utils.fc                     # Utility functions
│   └── wrappers/                        # TypeScript wrappers
├── backend/                       # Node.js microservices
│   └── src/
│       ├── api/routes/           # API endpoints
│       ├── services/             # Business logic
│       ├── workers/              # Background jobs
│       └── shared/               # Utilities, middleware
├── frontend/                      # Next.js web app
│   └── src/
│       ├── app/                  # Next.js app router
│       ├── components/
│       │   ├── telegram/         # Telegram integration
│       │   └── ...
│       └── store/                # Zustand store
├── admin-panel/                   # React admin dashboard
│   └── src/pages/                # Admin pages
├── telegram-bot/                  # Telegram bot
│   └── src/services/             # Bot services
└── scripts/                       # Deployment scripts
```

## 🔧 Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/nft-marketplace.git
cd nft-marketplace

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../admin-panel && npm install
cd ../telegram-bot && npm install

# Setup database
cd ../backend
npm run db:migrate
npm run db:seed

# Start all services
cd ../backend && npm run dev
cd ../frontend && npm run dev
cd ../admin-panel && npm run dev
cd ../telegram-bot && npm run dev
```

### Smart Contract Deployment

```bash
cd smart-contracts

# Install dependencies
npm install

# Compile contracts
npm run build

# Deploy proxy (address never changes!)
npm run deploy:proxy

# Deploy first implementation
npm run deploy:implementation

# Create NFT category
npm run create-category --name="Art Collection"

# Upgrade implementation (proxy address stays the same!)
npm run upgrade
```

## ⚙️ Configuration

### Environment Variables

Key variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/nft_marketplace

# Redis
REDIS_URL=redis://localhost:6379

# TON
TON_API_KEY=your_toncenter_api_key
TON_NETWORK=testnet
TON_CONTRACT_ADDRESS=EQ...  # This is the PROXY address - never changes!
TON_ADMIN_WALLET_MNEMONIC=word1 word2 ... word24

# Security
JWT_SECRET=your_jwt_secret

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook
```

## 🔐 Upgradeable Smart Contracts

The marketplace uses the proxy pattern for upgradeability:

1. **Proxy Contract**: Holds the state, never changes address
2. **Implementation Contract**: Contains the logic, can be upgraded
3. **Admin**: Can upgrade implementation without affecting users

### How Upgrades Work

```
┌─────────────────┐
│  Users dApps    │
└────────┬────────┘
         │ Always use this address
         ▼
┌─────────────────┐
│  Proxy Contract │  ← Never changes, holds state
│  Address: EQ... │
└────────┬────────┘
         │ Delegates to
         ▼
┌─────────────────┐
│ Implementation  │  ← Can be upgraded
│  Contract V1    │
└─────────────────┘
         ▲
         │ Upgrade
         ▼
┌─────────────────┐
│ Implementation  │
│  Contract V2    │
└─────────────────┘
```

### Security Features

- **Emergency Pause**: Stop all operations in case of emergency
- **Admin Transfer**: Transfer admin rights securely
- **Emergency Withdraw**: Recover funds if needed
- **Version Tracking**: Track which implementation is active

## 📝 API Documentation

### Authentication
- `POST /api/auth/nonce` - Generate auth nonce
- `POST /api/auth/wallet/verify` - Verify wallet signature
- `POST /api/auth/telegram` - Telegram authentication

### NFTs
- `GET /api/nfts` - List all NFTs
- `GET /api/nfts/:id` - Get NFT details
- `POST /api/nfts/deposit` - Deposit NFT
- `POST /api/nfts/withdraw` - Withdraw NFT
- `POST /api/nfts/receive-gift` - Receive offchain gift

### Auctions
- `GET /api/auctions` - List active auctions
- `POST /api/auctions` - Create auction
- `POST /api/auctions/:id/bid` - Place bid
- `POST /api/auctions/:id/end` - End auction

### Offers
- `GET /api/offers` - List offers
- `POST /api/offers` - Make offer
- `POST /api/offers/:id/accept` - Accept offer
- `POST /api/offers/:id/reject` - Reject offer

### Telegram Gifts (Offchain)
- `GET /api/admin/gifts` - List all gifts
- `GET /api/admin/gifts/pending` - Get pending withdrawals
- `POST /api/admin/gifts/:id/send` - Send gift to user
- `POST /api/admin/gifts/sync` - Sync with Telegram

## 🤖 Telegram Bot Commands

- `/start` - Start the bot
- `/help` - Show help
- `/inventory` - View your NFT inventory
- `/deposit` - Deposit a gift
- `/withdraw` - Withdraw a gift
- `/link` - Link website account
- `/balance` - Check balance

## 🔐 Security Considerations

1. **Proxy Pattern**: Always interact with the proxy address, never directly with implementations
2. **Admin Keys**: Keep admin wallet mnemonic secure and use multisig in production
3. **Upgrades**: Test upgrades thoroughly on testnet before mainnet
4. **Monitoring**: Monitor contract events for suspicious activity

## 📈 Performance

- **Caching**: Redis for frequently accessed data
- **CDN**: Image optimization
- **Database**: Connection pooling
- **Queue System**: Background job processing
- **Load Balancing**: Multiple API instances

## 🧪 Testing

```bash
# Backend tests
npm run test

# Smart contract tests
npm run test:contracts

# E2E tests
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- [TON Blockchain](https://ton.org)
- [TonConnect](https://github.com/ton-connect)
- [Telegraf](https://telegraf.js.org/)

---

Built with ❤️ for the TON ecosystem
