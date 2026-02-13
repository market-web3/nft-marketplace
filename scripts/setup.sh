#!/bin/bash

# Setup script for TON NFT Marketplace

echo "🔧 Setting up TON NFT Marketplace..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get project root
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT" || exit

echo -e "${BLUE}Project root: $PROJECT_ROOT${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            echo -e "${RED}Node.js version 18 or higher is required${NC}"
            exit 1
        fi
        echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"
    else
        echo -e "${RED}Node.js is not installed${NC}"
        exit 1
    fi
}

# Setup a service
setup_service() {
    local service=$1
    local name=$2
    
    echo ""
    echo -e "${YELLOW}Setting up $name...${NC}"
    
    cd "$PROJECT_ROOT/$service" || exit
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    else
        echo "Dependencies already installed"
    fi
    
    # Copy .env if doesn't exist
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        echo "Creating .env from .env.example"
        cp .env.example .env
    fi
    
    echo -e "${GREEN}✓ $name setup complete${NC}"
    
    cd "$PROJECT_ROOT" || exit
}

# Main setup
echo ""
echo "Checking prerequisites..."
check_node_version

if command_exists docker; then
    echo -e "${GREEN}✓ Docker is installed${NC}"
else
    echo -e "${YELLOW}⚠ Docker is not installed (optional for local development)${NC}"
fi

echo ""
echo -e "${BLUE}Installing dependencies for all services...${NC}"

# Setup Backend
setup_service "backend" "Backend API"

# Setup Frontend
setup_service "frontend" "Frontend"

# Setup Admin Panel
setup_service "admin-panel" "Admin Panel"

# Setup Telegram Bot
setup_service "telegram-bot" "Telegram Bot"

# Setup Smart Contracts
echo ""
echo -e "${YELLOW}Setting up Smart Contracts...${NC}"
cd "$PROJECT_ROOT/smart-contracts" || exit
if [ ! -d "node_modules" ]; then
    npm install
fi
echo -e "${GREEN}✓ Smart Contracts setup complete${NC}"

cd "$PROJECT_ROOT" || exit

# Create necessary directories
echo ""
echo "Creating necessary directories..."
mkdir -p logs
touch logs/.gitkeep

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure environment variables:"
echo "   - Edit backend/.env"
echo "   - Edit frontend/.env.local"
echo "   - Edit admin-panel/.env"
echo "   - Edit telegram-bot/.env"
echo ""
echo "2. Setup database:"
echo "   cd backend && npm run db:migrate"
echo ""
echo "3. Start services:"
echo "   Option A - Using start script:"
echo "     ./scripts/start-all.sh"
echo ""
echo "   Option B - Using Docker:"
echo "     cd docker && docker-compose up -d"
echo ""
echo "   Option C - Manual start:"
echo "     cd backend && npm run dev"
echo "     cd frontend && npm run dev"
echo "     cd admin-panel && npm run dev"
echo "     cd telegram-bot && npm run dev"
echo ""
echo "4. Access the applications:"
echo "   - Frontend: http://localhost:3002"
echo "   - Admin Panel: http://localhost:3003"
echo "   - Backend API: http://localhost:3001"
echo ""
