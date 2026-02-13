#!/bin/bash

# Deployment Script for TON NFT Marketplace

set -e

ENV=${1:-production}
echo "🚀 Deploying TON NFT Marketplace to $ENV environment..."

# Validate environment
if [ "$ENV" != "production" ] && [ "$ENV" != "staging" ]; then
    echo "❌ Invalid environment. Use 'production' or 'staging'"
    exit 1
fi

# Build applications
echo "🏗️  Building applications..."

echo "Building backend..."
cd backend
npm run build
cd ..

echo "Building frontend..."
cd frontend
npm run build
cd ..

echo "Building admin panel..."
cd admin-panel
npm run build
cd ..

echo "Building telegram bot..."
cd telegram-bot
npm run build
cd ..

# Deploy with Docker Compose
echo "🐳 Deploying with Docker Compose..."

export COMPOSE_PROJECT_NAME=nft-marketplace-$ENV

docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up -d --build

# Run migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker/docker-compose.yml exec -T backend npm run db:migrate

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Services are available at:"
echo "  - Frontend:  http://localhost:3002"
echo "  - API:       http://localhost:3001"
echo "  - Admin:     http://localhost:3003"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker/docker-compose.yml logs -f"
echo ""
