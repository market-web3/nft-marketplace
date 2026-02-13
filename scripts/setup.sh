#!/bin/bash

# TON NFT Marketplace Setup Script

echo "🚀 Setting up TON NFT Marketplace..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version check passed"

# Install dependencies
echo "📦 Installing dependencies..."

cd backend
npm install
cd ..

cd frontend
npm install
cd ..

cd admin-panel
npm install
cd ..

cd telegram-bot
npm install
cd ..

cd smart-contracts
npm install
cd ..

echo "✅ Dependencies installed"

# Setup environment files
echo "🔧 Setting up environment files..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from example"
fi

echo ""
echo "⚠️  IMPORTANT: Please edit the .env file with your configuration:"
echo "   - Database credentials"
echo "   - TON API key"
echo "   - Telegram bot token"
echo "   - JWT secrets"
echo ""

# Setup database
echo "🗄️  Setting up database..."
echo "   Make sure PostgreSQL is running and configured in .env"
read -p "   Run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    npm run db:migrate
    cd ..
    echo "✅ Database migrations completed"
fi

# Build smart contracts
echo "🔗 Building smart contracts..."
cd smart-contracts
npm run build
cd ..

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start the development servers:"
echo "  1. Backend:   cd backend && npm run dev"
echo "  2. Frontend:  cd frontend && npm run dev"
echo "  3. Admin:     cd admin-panel && npm run dev"
echo "  4. Telegram:  cd telegram-bot && npm run dev"
echo ""
echo "Or use Docker Compose:"
echo "  docker-compose up -d"
echo ""
