# NFT Marketplace on TON Blockchain

A production-ready, high-load NFT marketplace built on The Open Network (TON) blockchain.

## 🚀 Features

### Smart Contracts (FunC)
- **Main Marketplace Contract**: Handles all NFT operations
- **Highload Wallet Integration**: Dedicated wallets per NFT category for scalability
- **Virtual Balance Manager**: Off-chain balance system for fee optimization
- **NFT Item Contract**: TEP-62 compliant NFT implementation
- **Auction Contract**: Time-based bidding system

### Backend (Node.js/TypeScript)
- **Microservices Architecture**: Scalable service-oriented design
- **High-Load Support**: Handles 1000+ concurrent users
- **Real-time Updates**: WebSocket gateway for live data
- **Security**: Anti double-spend, replay protection, hash validation
- **Caching**: Redis for performance optimization
- **Queue System**: RabbitMQ for background jobs

### Frontend (Next.js/React)
- **Responsive Design**: Mobile, tablet, desktop optimized
- **Wallet Integration**: TonConnect support
- **Real-time Updates**: Live price feeds, auction countdowns
- **Virtual Balance**: On-chain/off-chain balance management

### Admin Panel
- **Category Management**: Create NFT categories with highload wallets
- **User Management**: Ban/unban, view statistics
- **Transaction Monitoring**: Real-time tracking
- **Wallet Monitoring**: Deposit/withdraw wallet tracking

### Telegram Bot
- **Instant Notifications**: Sales, offers, auction updates
- **Authentication**: Link Telegram to platform
- **Off-chain Gifts**: Telegram gift system integration

## 📁 Project Structure

```
nft-marketplace/
├── smart-contracts/          # TON FunC contracts
│   ├── contracts/
│   │   ├── nft_marketplace.fc
│   │   ├── nft_item.fc
│   │   ├── virtual_balance_manager.fc
│   │   ├── auction.fc
│   │   ├── highload_adapter.fc
│   │   └── ...
│   └── wrappers/            # Contract wrappers
├── backend/                 # Node.js microservices
│   ├── src/
│   │   ├── api/            # REST API
│   │   ├── gateway/        # WebSocket gateway
│   │   ├── services/       # Business logic
│   │   ├── workers/        # Background jobs
│   │   └── shared/         # Utils, models
│   └── Dockerfile
├── frontend/               # Next.js web app
│   ├── src/
│   │   ├── app/           # App router
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   └── store/         # State management
│   └── Dockerfile
├── admin-panel/           # React admin dashboard
├── telegram-bot/          # Telegram bot
└── docker/               # Docker compose configs
```

## 🔧 Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- RabbitMQ 3+
- Docker & Docker Compose

### Quick Start (Docker)

```bash
# Clone repository
git clone https://github.com/your-org/nft-marketplace.git
cd nft-marketplace

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services
cd docker
docker-compose up -d
```

### Manual Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## ⚙️ Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/nft_marketplace

# Redis
REDIS_URL=redis://localhost:6379

# TON
TON_API_KEY=your_toncenter_api_key
TON_NETWORK=testnet
TON_CONTRACT_ADDRESS=EQ...

# Security
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
```

## 📊 Smart Contract Deployment

### Compile Contracts
```bash
cd smart-contracts
func -o build/nft_marketplace.fif contracts/nft_marketplace.fc
```

### Deploy Main Contract
```bash
npm run deploy:marketplace
```

### Create NFT Category with Highload Wallet
```bash
npm run create-category --name="Art Collection"
```

## 🎮 API Endpoints

### Authentication
- `POST /api/auth/nonce` - Generate auth nonce
- `POST /api/auth/wallet/verify` - Verify wallet signature
- `POST /api/auth/telegram` - Telegram authentication

### NFTs
- `GET /api/nfts` - List all NFTs
- `GET /api/nfts/:id` - Get NFT details
- `POST /api/nfts/deposit` - Deposit NFT
- `POST /api/nfts/withdraw` - Withdraw NFT
- `POST /api/nfts/gift` - Send as gift

### Listings
- `GET /api/listings` - Active listings
- `POST /api/listings/fixed` - Create fixed price listing
- `POST /api/listings/auction` - Create auction
- `POST /api/listings/:id/buy` - Buy NFT
- `POST /api/listings/:id/bid` - Place bid

## 🔐 Security Features

- **Anti Double-Spend**: Transaction tracking with hash validation
- **Replay Protection**: Nonce-based request validation
- **Rate Limiting**: Per-user and global rate limits
- **Hash Comments**: Secure deposit/withdrawal verification
- **Virtual Balance**: Off-chain accounting with on-chain settlement

## 📈 Performance

- **Caching**: Redis for frequently accessed data
- **CDN**: Image optimization and delivery
- **Database**: Connection pooling, read replicas
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
- [Highload Wallet V3](https://github.com/ton-blockchain/highload-wallet-contract-v3)
