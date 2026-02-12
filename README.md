# TON NFT Marketplace - Complete System

A production-ready, full-featured NFT marketplace built on The Open Network (TON) blockchain with enhanced auction system, offer management, and Telegram integration.

## 🚀 Features

### Smart Contracts (FunC)
- **Main Marketplace Contract V3** (`nft_marketplace_v3.fc`)
  - Admin wallet direct approval - no admin panel dependency in contract
  - **Enhanced Auction System**: Configurable duration (7 days to 1 year)
  - **Enhanced Offer System**: Time-limited offers (1 hour to 30 days)
  - Automatic TON handling for offers (lock, release on accept/reject/expiry)
  - Automatic offer cancellation on expiry
  - Fixed price listings
  - NFT deposit/withdrawal
  - Virtual balance support

### Backend (Node.js/TypeScript)
- Microservices architecture
- Real-time updates via WebSocket
- Redis caching
- PostgreSQL database
- Anti double-spend protection
- Rate limiting

### Frontend (Next.js/React)
- **Wallet Integration**: TonConnect support
- **Home Page**: Animated hero, stats, categories, featured NFTs, trending auctions
- **Market Page**: Search, filters, sorting, grid/list view
- **Inventory Page**: NFTs, deposited items, Telegram gifts
- **Profile Page**: Stats, created/owned NFTs, activity history
- **Responsive Design**: Mobile, tablet, desktop optimized
- **Dark Mode**: Full dark mode support

### Admin Panel (React + Vite)
- **Dashboard**: Statistics, charts, recent activity
- **NFT Management**: Approve/reject NFTs, view all listings
- **Auction Management**: Create, start, end auctions
- **Offers Management**: Monitor and manage offers
- **Telegram Gifts**: Sync with Telegram, manage withdrawals
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
│   │   ├── nft_marketplace_v3.fc    # Main contract (enhanced)
│   │   ├── auction.fc               # Auction contract
│   │   ├── op_codes.fc              # Operation codes
│   │   ├── errors.fc                # Error codes
│   │   └── utils.fc                 # Utility functions
│   └── wrappers/                   # Contract wrappers
├── backend/                       # Node.js microservices
│   └── src/
├── frontend/                      # Next.js web app
│   └── src/
│       ├── app/                  # Next.js app router
│       ├── components/
│       │   ├── home/            # Home page components
│       │   ├── layout/          # Layout components
│       │   ├── common/          # Shared components
│       │   └── providers/       # Context providers
│       └── store/               # Zustand store
├── admin-panel/                   # React admin dashboard
│   └── src/
│       ├── components/
│       └── pages/
├── telegram-bot/                  # Telegram bot
│   └── src/
│       └── services/
└── docker/                       # Docker configurations
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

# Install dependencies and start all services
cd frontend && npm install && npm run dev
cd ../admin-panel && npm install && npm run dev
cd ../telegram-bot && npm install && npm run dev
cd ../backend && npm install && npm run dev
```

### Smart Contract Deployment

```bash
cd smart-contracts

# Compile contracts
npm run build

# Deploy main contract
npm run deploy:marketplace

# Create NFT category
npm run create-category --name="Art Collection"
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
TON_CONTRACT_ADDRESS=EQ...
TON_ADMIN_WALLET_MNEMONIC=word1 word2 ... word24

# Security
JWT_SECRET=your_jwt_secret

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
```

## 📝 Smart Contract Features

### Auction System
- **Minimum Duration**: 7 days
- **Maximum Duration**: 365 days (1 year)
- **Bid Refunds**: Automatic refund of previous highest bidder
- **Reserve Price**: Seller can set minimum acceptable price
- **Fee Distribution**: Automatic fee calculation and distribution

### Offer System
- **Duration**: 1 hour to 30 days (user configurable)
- **TON Locking**: Offer amount locked in contract
- **Auto-expiry**: Expired offers automatically return TON to buyer
- **Accept/Reject**: Seller can accept (distributes TON) or reject (returns TON)

### Admin Operations
All admin operations are performed directly from the admin wallet:
- Create categories
- Set marketplace fee
- Pause/resume marketplace
- Emergency withdraw

No admin panel functionality exists in the contract - it's all wallet-based for security.

## 🎨 Frontend Features

### Animations
- Smooth page transitions
- Hover effects on NFT cards
- Floating elements in hero section
- Loading skeletons
- Countdown timers for auctions

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Adaptive navigation (mobile menu)
- Responsive grid layouts

## 🤖 Telegram Bot Commands

- `/start` - Start the bot
- `/help` - Show help
- `/inventory` - View your NFTs
- `/deposit` - Deposit a gift
- `/withdraw` - Withdraw a gift
- `/link` - Link website account
- `/balance` - Check balance

## 📊 API Endpoints

### Authentication
- `POST /api/auth/nonce` - Generate auth nonce
- `POST /api/auth/wallet/verify` - Verify wallet signature
- `POST /api/auth/telegram` - Telegram authentication

### NFTs
- `GET /api/nfts` - List all NFTs
- `GET /api/nfts/:id` - Get NFT details
- `POST /api/nfts/deposit` - Deposit NFT
- `POST /api/nfts/withdraw` - Withdraw NFT

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

## 🔐 Security Features

- **Anti Double-Spend**: Transaction tracking
- **Replay Protection**: Nonce-based validation
- **Rate Limiting**: Per-user and global limits
- **Hash Comments**: Secure deposit verification
- **Wallet Verification**: Signature-based auth

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

## 📚 Documentation

- [Smart Contract Guide](docs/smart-contracts.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Architecture Overview](docs/architecture.md)

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
