#!/bin/bash

# HUMANWRITER AI - Development Startup Script
# This script starts all necessary services for development

set -e

echo "🚀 Starting HUMANWRITER AI Development Environment"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "webapp" ]; then
    echo -e "${RED}❌ Error: Must run from HUMANWRITER-AI root directory${NC}"
    exit 1
fi

cd /home/user/HUMANWRITER-AI

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Function to start PostgreSQL in Docker
start_postgres() {
    echo -e "\n${GREEN}📦 Starting PostgreSQL...${NC}"
    
    # Check if container exists
    if docker ps -a | grep -q humanwriter-postgres; then
        echo "Container exists, starting..."
        docker start humanwriter-postgres 2>/dev/null || true
    else
        echo "Creating new PostgreSQL container..."
        docker run -d \
            --name humanwriter-postgres \
            -e POSTGRES_USER=humanwriter \
            -e POSTGRES_PASSWORD=humanwriter \
            -e POSTGRES_DB=humanwriter \
            -p 5432:5432 \
            -v humanwriter_postgres_data:/var/lib/postgresql/data \
            postgres:15-alpine
    fi
    
    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if docker exec humanwriter-postgres pg_isready -U humanwriter >/dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
    done
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    return 1
}

# Function to start Redis in Docker
start_redis() {
    echo -e "\n${GREEN}📦 Starting Redis...${NC}"
    
    # Check if container exists
    if docker ps -a | grep -q humanwriter-redis; then
        echo "Container exists, starting..."
        docker start humanwriter-redis 2>/dev/null || true
    else
        echo "Creating new Redis container..."
        docker run -d \
            --name humanwriter-redis \
            -p 6379:6379 \
            -v humanwriter_redis_data:/data \
            redis:7-alpine
    fi
    
    echo -e "${GREEN}✅ Redis started${NC}"
}

# Start services
echo -e "\n${YELLOW}Step 1: Starting Docker Services${NC}"
start_postgres || exit 1
start_redis || exit 1

# Run Prisma migrations
echo -e "\n${YELLOW}Step 2: Running Database Migrations${NC}"
cd webapp
echo "Generating Prisma client..."
npx prisma generate

echo "Running migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push

echo -e "${GREEN}✅ Database ready${NC}"
cd ..

# Start Backend API
echo -e "\n${YELLOW}Step 3: Starting Backend API (port 4000)${NC}"
cd backend-api

if check_port 4000; then
    echo "Installing dependencies..."
    npm install --silent 2>/dev/null || true
    
    echo "Starting backend..."
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    echo -e "${GREEN}✅ Backend API started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}Backend already running on port 4000${NC}"
fi
cd ..

# Start AI Engine
echo -e "\n${YELLOW}Step 4: Starting AI Engine (port 8000)${NC}"
cd ai-engine

if check_port 8000; then
    echo "Starting AI Engine..."
    python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/ai-engine.log 2>&1 &
    AI_PID=$!
    echo $AI_PID > ../logs/ai-engine.pid
    echo -e "${GREEN}✅ AI Engine started (PID: $AI_PID)${NC}"
else
    echo -e "${YELLOW}AI Engine already running on port 8000${NC}"
fi
cd ..

# Start Frontend
echo -e "\n${YELLOW}Step 5: Starting Frontend (port 3000)${NC}"
cd webapp

if check_port 3000; then
    echo "Starting Next.js dev server..."
    npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${YELLOW}Frontend already running on port 3000${NC}"
fi
cd ..

# Summary
echo -e "\n${GREEN}=================================================="
echo "✅ HUMANWRITER AI Development Environment Ready!"
echo "==================================================${NC}"
echo ""
echo "Services running:"
echo "  🗄️  PostgreSQL:  localhost:5432"
echo "  🔴 Redis:        localhost:6379"
echo "  🔧 Backend API:  http://localhost:4000"
echo "  🤖 AI Engine:    http://localhost:8000"
echo "  🌐 Frontend:     http://localhost:3000"
echo ""
echo "Logs available in ./logs/"
echo ""
echo "To stop all services:"
echo "  ./stop-dev.sh"
echo ""
