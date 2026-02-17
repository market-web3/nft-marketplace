# TON NFT Marketplace - Next-Generation Platform

A production-ready, next-generation NFT marketplace built on The Open Network (TON) blockchain with Tact smart contracts, Wallet V5 gasless transactions, ZK-SNARKs privacy layer, AI-powered vector search, custom Rust indexer, and cross-chain bridges. The system surpasses Getgems, Portals, and Tonnel in functionality, UX, and privacy.

## 🚀 Next-Generation Features

### 🎯 Smart Contracts (Tact - Upgradeable)
- **Proxy Pattern**: Contract address never changes during upgrades
- **Main Marketplace Contract** (`Marketplace.tact`)
  - Admin wallet direct approval
  - **Enhanced Auction System**: English & Sealed-Bid auctions with ZK-SNARKs
  - **Enhanced Offer System**: Time-limited offers with automatic expiry
  - **Shopping Cart**: Batch up to 255 NFTs in single transaction
  - Fixed price listings
  - NFT deposit/withdrawal
  - **Security Features**:
    - Emergency pause/unpause
    - Reentrancy guards
    - Bounce handlers for 100% fund recovery
    - Version tracking

- **Sale Contract** (`Sale.tact`)
  - Individual sale contract per NFT
  - Direct sale with fee calculation
  - Royalty support

- **Auction Contract** (`Auction.tact`)
  - English auction with time extensions
  - Bid refund mechanism
  - Reserve price support

- **SealedBidAuction Contract** (`SealedBidAuction.tact`)
  - Commit-Reveal scheme
  - **ZK-SNARKs integration** for bid privacy
  - Pedersen/Poseidon hash verification
  - Anti-front-running protection

- **Offer Contract** (`Offer.tact`)
  - Time-limited offers
  - Automatic expiry handling
  - Fund locking mechanism

- **ONFT Contract** (`ONFT.tact`)
  - Cross-chain NFT bridges
  - **LayerZero integration**
  - **Wormhole integration**
  - Multi-chain support (TON, Ethereum, Solana, BSC, Arbitrum, Optimism, Polygon)

### 🔐 ZK-SNARKs Privacy Layer
- **Commitment Circuit**: Pedersen hash for bid commitments
- **Verification Circuit**: Verify bid amounts and commitments
- **Merkle Proof Circuit**: NFT ownership and whitelist verification
- **Circom Circuits** with trusted setup ceremony
- **Proof Generation & Verification**: Client & server-side

### 💳 Wallet V5 & Gasless Transactions
- **Relayer Service**: Gasless transaction sponsorship
- **Wallet V5 Support**: Latest TON wallet standard
- **Transaction Batching**: Up to 255 messages in single transaction
- **Fee Options**:
  - USDT (Jetton) payment
  - NOT coin payment
  - Fully subsidized transactions for premium users
- **Rate Limiting & Abuse Detection**

### 🤖 AI-Powered Services
- **Embeddings Service**:
  - CLIP model for image embeddings (512-dimensional)
  - Text embedding for descriptions
  - PostgreSQL pgvector integration
  - Semantic text-to-image search
  - Similar NFT recommendations

- **Trust Engine (GNN)**:
  - Graph Neural Network for trust scoring
  - Wash trading detection
  - Anomaly detection
  - Real-time trust score calculation
  - Suspicious pattern identification

### ⚡ Custom Rust Indexer
- **High Performance**: Handles TON's ~100K TPS
- **Apache Kafka Integration**: Event streaming pipeline
- **ScyllaDB**: Write-optimized database for raw transactions
- **Real-time Parsing**:
  - NFT transfer events
  - Marketplace events
  - Auction events
  - Cross-chain events
- **Prometheus Metrics**: Built-in monitoring

### 🌉 Cross-Chain Bridges
- **LayerZero**: Universal cross-chain messaging
- **Wormhole**: Secure bridge with guardian network
- **ONFT Standard**: Omnichain NFT protocol
- **7 Chains Supported**: TON, Ethereum, Solana, BSC, Arbitrum, Optimism, Polygon

### 🏗️ Infrastructure
- **Apache Kafka**: Event streaming
- **ScyllaDB**: High-performance NoSQL database
- **PostgreSQL + pgvector**: Vector similarity search
- **IPFS**: Decentralized metadata storage
- **Redis Cluster**: High availability caching
- **RabbitMQ**: Background job queue

### 🎨 Frontend (Next.js/React)
- **Telegram Mini App SDK**: Native mobile experience
- **Wallet Integration**: TonConnect V2
- **Features**:
  - Shopping cart for batch purchases
  - Sealed-bid auction UI
  - Cross-chain bridge interface
  - ZK proof submission
  - AI-powered recommendations
  - Dark pool trading
  - Real-time updates via WebSocket
- **Responsive Design**: Mobile-first approach

### Backend (Node.js/TypeScript)
- Microservices architecture
- Real-time updates via WebSocket
- Redis caching
- PostgreSQL database
- Anti double-spend protection
- Rate limiting
- Kafka consumers for event processing
- Background job processing with BullMQ

### Admin Panel (React + Vite)
- **Dashboard**: Statistics, charts, recent activity
- **NFT Management**: Approve/reject NFTs, view all listings
- **Auction Management**: Create, start, end auctions
- **Offers Management**: Monitor and manage offers
- **Trust Score Management**: View trust scores, investigate suspicious activity
- **Cross-Chain Management**: Monitor bridge transactions
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
├── smart-contracts/          # TON Smart Contracts
│   ├── contracts/            # FunC contracts (legacy)
│   │   ├── proxy.fc                     # Upgradeable proxy contract
│   │   ├── nft_marketplace_upgradeable.fc # Implementation contract
│   │   ├── auction.fc                   # Auction contract
│   │   └── ...
│   ├── tact/                 # Tact contracts (next-gen)
│   │   ├── Marketplace.tact            # Main marketplace with shopping cart
│   │   ├── Sale.tact                   # Individual sale contract
│   │   ├── Auction.tact                # English auction
│   │   ├── SealedBidAuction.tact        # Privacy-preserving auction
│   │   ├── Offer.tact                  # Time-limited offers
│   │   ├── ShoppingCart.tact            # Batch purchase trait
│   │   ├── ONFT.tact                   # Cross-chain NFT
│   │   └── traits/                     # Reusable traits
│   │       ├── Ownable.tact
│   │       ├── Pausable.tact
│   │       └── ReentrancyGuard.tact
│   └── wrappers/             # TypeScript wrappers
├── zk-circuits/             # ZK-SNARK circuits
│   ├── commitment.circom    # Bid commitment circuit
│   ├── verifyBid.circom     # Bid verification circuit
│   ├── merkleProof.circom   # Merkle proof verification
│   ├── scripts/             # Compilation & setup scripts
│   │   ├── compile.sh
│   │   └── setup.sh
│   └── circuit.env          # Circuit configuration
├── indexer/                 # Rust-based custom indexer
│   ├── src/
│   │   ├── main.rs          # Entry point
│   │   ├── parser/          # Block/transaction parsers
│   │   ├── kafka/           # Kafka producer
│   │   ├── scylladb/        # ScyllaDB client
│   │   ├── metrics/         # Prometheus metrics
│   │   ├── config.rs        # Configuration
│   │   └── types.rs         # Data structures
│   ├── config/
│   │   └── config.toml      # Indexer configuration
│   └── Cargo.toml           # Rust dependencies
├── ai-services/             # AI-powered services
│   ├── embeddings/           # Vector embedding service
│   │   ├── main.py          # FastAPI application
│   │   ├── requirements.txt # Python dependencies
│   │   └── Dockerfile       # Container definition
│   └── trust-engine/         # GNN trust scoring
│       ├── main.py
│       ├── requirements.txt
│       └── Dockerfile
├── relayer/                 # Gasless transaction relayer
│   ├── src/
│   │   └── index.ts         # Relayer server
│   └── package.json
├── cross-chain/             # Cross-chain bridge services
│   ├── layerzero.ts         # LayerZero integration
│   ├── wormhole.ts          # Wormhole integration
│   └── nft-wrapper.ts       # ONFT wrapper
├── backend/                 # Node.js microservices
│   └── src/
│       ├── api/routes/       # API endpoints
│       ├── services/         # Business logic
│       ├── workers/          # Background jobs
│       └── shared/           # Utilities, middleware
├── frontend/                # Next.js web app
│   └── src/
│       ├── app/             # Next.js app router
│       ├── components/
│       │   ├── telegram/    # Telegram integration
│       │   ├── marketplace/ # Marketplace components
│       │   ├── auction/     # Auction components
│       │   ├── bridge/      # Cross-chain bridge UI
│       │   └── ...
│       └── store/            # Zustand store
├── admin-panel/             # React admin dashboard
│   └── src/pages/           # Admin pages
├── telegram-bot/            # Telegram bot
│   └── src/services/        # Bot services
├── docker/                  # Docker configurations
│   └── docker-compose.yml    # Container orchestration
└── scripts/                 # Deployment scripts
```

## 🔧 Installation

### Prerequisites
- Node.js 20+
- Python 3.11+
- Rust 1.75+
- PostgreSQL 15+ with pgvector extension
- Redis 7+
- Docker & Docker Compose (optional)

### Quick Start with Docker

```bash
# Clone repository
git clone https://github.com/your-org/nft-marketplace.git
cd nft-marketplace

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services with Docker Compose
cd docker
docker-compose up -d

# Access services
# Frontend: http://localhost:3002
# Backend: http://localhost:3001
# Admin Panel: http://localhost:3003
# Indexer Metrics: http://localhost:9090
# Embeddings Service: http://localhost:8001
# Trust Engine: http://localhost:8002
# Relayer: http://localhost:3005
```

### Manual Installation

```bash
# Clone repository
git clone https://github.com/your-org/nft-marketplace.git
cd nft-marketplace

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Install Node.js dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../admin-panel && npm install
cd ../telegram-bot && npm install
cd ../relayer && npm install

# Install Python dependencies
cd ../ai-services/embeddings && pip install -r requirements.txt
cd ../trust-engine && pip install -r requirements.txt

# Install Rust dependencies
cd ../../indexer
cargo build --release

# Setup database
cd ../backend
npm run db:migrate
npm run db:seed

# Enable pgvector extension
psql -U postgres -d nft_marketplace -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Start services (in separate terminals)
cd ../backend && npm run dev
cd ../frontend && npm run dev
cd ../admin-panel && npm run dev
cd ../telegram-bot && npm run dev
cd ../relayer && npm run dev
cd ../indexer && cargo run --release
cd ../ai-services/embeddings && python main.py
cd ../trust-engine && python main.py
```

### Smart Contract Deployment (Tact)

```bash
cd smart-contracts/tact

# Install Tact compiler
npm install -g @tact-lang/compiler

# Compile contracts
tact compile Marketplace.tact
tact compile Sale.tact
tact compile Auction.tact
tact compile SealedBidAuction.tact
tact compile Offer.tact
tact compile ONFT.tact

# Deploy contracts using Blueprint or toncli
# Example with Blueprint:
npx blueprint deploy Marketplace --args "EQ...,..."

# Deploy ONFT for cross-chain
npx blueprint deploy ONFT --args "EQ...,EQ...,null,null"
```

### ZK Circuit Compilation

```bash
cd zk-circuits

# Install dependencies
npm install

# Compile circuits
chmod +x scripts/compile.sh
./scripts/compile.sh

# Run trusted setup ceremony
chmod +x scripts/setup.sh
./scripts/compile.sh commitment

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

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# ScyllaDB
SCYLLA_NODES=localhost:9042

# AI Services
EMBEDDINGS_SERVICE_URL=http://localhost:8001
TRUST_ENGINE_URL=http://localhost:8002

# Relayer
RELAYER_URL=http://localhost:3005
RELAYER_PRIVATE_KEY=your_relayer_private_key

# Cross-Chain
LAYERZERO_ENDPOINT=your_layerzero_endpoint
WORMHOLE_GUARDIAN=your_wormhole_guardian

# Security
JWT_SECRET=your_jwt_secret

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
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
- **Reentrancy Guards**: Prevent reentrancy attacks
- **Bounce Handlers**: 100% fund recovery on failed transactions
- **Admin Transfer**: Transfer admin rights securely
- **Emergency Withdraw**: Recover funds if needed
- **Version Tracking**: Track which implementation is active

## 📝 API Documentation

### Core Backend API

#### Authentication
- `POST /api/auth/nonce` - Generate auth nonce
- `POST /api/auth/wallet/verify` - Verify wallet signature
- `POST /api/auth/telegram` - Telegram authentication

#### NFTs
- `GET /api/nfts` - List all NFTs
- `GET /api/nfts/:id` - Get NFT details
- `POST /api/nfts/deposit` - Deposit NFT
- `POST /api/nfts/withdraw` - Withdraw NFT
- `POST /api/nfts/receive-gift` - Receive offchain gift

#### Auctions
- `GET /api/auctions` - List active auctions
- `POST /api/auctions` - Create auction
- `POST /api/auctions/:id/bid` - Place bid
- `POST /api/auctions/:id/end` - End auction

#### Offers
- `GET /api/offers` - List offers
- `POST /api/offers` - Make offer
- `POST /api/offers/:id/accept` - Accept offer
- `POST /api/offers/:id/reject` - Reject offer

#### Shopping Cart
- `GET /api/cart` - Get shopping cart
- `POST /api/cart/add` - Add item to cart
- `DELETE /api/cart/:itemId` - Remove item from cart
- `POST /api/cart/checkout` - Checkout all items

### AI Embeddings Service

#### Text Embeddings
- `POST /embeddings/text` - Generate text embedding
- `POST /embeddings/batch` - Generate batch embeddings

#### Image Embeddings
- `POST /embeddings/image` - Generate image embedding from file

#### Semantic Search
- `POST /search` - Semantic NFT search
  - Request: `{ "query": "blue abstract art", "limit": 10 }`
  - Response: `{ "results": [...], "query_embedding": [...] }`

### Trust Engine Service

#### Trust Scores
- `POST /trust/score` - Get wallet trust score
- `POST /trust/batch` - Get batch trust scores

#### Wash Trading Detection
- `POST /wash-trading/detect` - Detect wash trading
  - Request: `{ "nft_id": 123, "time_window_days": 30 }`
  - Response: `{ "is_wash_trading": true, "probability": 0.85, "suspicious_patterns": [...] }`

#### Anomaly Detection
- `POST /anomalies/detect` - Detect anomalous activity

### Gasless Relayer Service

#### Transaction Relaying
- `POST /api/relay/submit` - Submit gasless transaction
- `POST /api/relay/batch` - Submit batch of transactions
- `GET /api/relay/status/:txHash` - Get transaction status

#### Gas Estimation
- `POST /api/gas/estimate` - Estimate gas cost

#### Gas Sponsorship
- `POST /api/sponsorship/apply` - Apply for gas sponsorship

### Telegram Gifts (Offchain)
- `GET /api/admin/gifts` - List all gifts
- `GET /api/admin/gifts/pending` - Get pending withdrawals
- `POST /api/admin/gifts/:id/send` - Send gift to user
- `POST /api/admin/gifts/sync` - Sync with Telegram

### Indexer Metrics
- `GET /metrics` - Prometheus metrics (port 9090)
  - `indexer_blocks_processed_total` - Total blocks processed
  - `indexer_events_processed_total` - Total events processed
  - `indexer_current_block` - Current block being processed
  - `indexer_kafka_messages_sent_total` - Total Kafka messages sent
  - `indexer_scylla_writes_total` - Total ScyllaDB writes

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
