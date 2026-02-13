#!/bin/bash

# Start all services for NFT Marketplace

echo "🚀 Starting TON NFT Marketplace..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "Checking dependencies..."

if ! command_exists node; then
    echo -e "${RED}Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}npm is not installed${NC}"
    exit 1
fi

# Check Docker if using docker-compose
if [ "$1" = "--docker" ]; then
    if ! command_exists docker; then
        echo -e "${RED}Docker is not installed${NC}"
        exit 1
    fi
    if ! command_exists docker-compose; then
        echo -e "${RED}Docker Compose is not installed${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Starting with Docker Compose...${NC}"
    cd ../docker && docker-compose up -d
    echo -e "${GREEN}Services started with Docker!${NC}"
    echo "Backend: http://localhost:3001"
    echo "Frontend: http://localhost:3002"
    echo "Admin Panel: http://localhost:3003"
    echo "RabbitMQ Management: http://localhost:15672"
    exit 0
fi

# Start services manually
echo -e "${YELLOW}Starting services manually...${NC}"

# Check if .env files exist
check_env() {
    local service=$1
    if [ ! -f "../$service/.env" ]; then
        echo -e "${YELLOW}Warning: $service/.env not found. Copying from .env.example${NC}"
        cp "../$service/.env.example" "../$service/.env" 2>/dev/null || true
    fi
}

check_env "backend"
check_env "frontend"
check_env "admin-panel"
check_env "telegram-bot"

# Function to start a service
start_service() {
    local service=$1
    local port=$2
    local color=$3
    
    echo -e "${color}Starting $service on port $port...${NC}"
    
    cd "../$service" || exit
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies for $service..."
        npm install
    fi
    
    # Start the service in background
    npm run dev &
    
    cd - > /dev/null || exit
}

# Start Backend
start_service "backend" "3001" "$GREEN"

# Start Frontend
start_service "frontend" "3002" "$GREEN"

# Start Admin Panel
start_service "admin-panel" "3003" "$GREEN"

# Start Telegram Bot
start_service "telegram-bot" "3004" "$GREEN"

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "Services running at:"
echo "  Backend API:    http://localhost:3001"
echo "  Frontend:       http://localhost:3002"
echo "  Admin Panel:    http://localhost:3003"
echo "  Telegram Bot:   http://localhost:3004"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background processes
wait
