#!/bin/bash

set -e

echo "🚀 HumanWriter AI - Setup Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${YELLOW}Warning: This script is optimized for Linux. Some steps may need adjustment for other OS.${NC}"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 20.x or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

if ! command_exists python3; then
    echo -e "${RED}❌ Python3 not found. Please install Python 3.11 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python3 found: $(python3 --version)${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker not found. Please install Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found: $(docker-compose --version)${NC}"

echo ""
echo "📦 Installing Ollama..."
if ! command_exists ollama; then
    curl -fsSL https://ollama.com/install.sh | sh
    echo -e "${GREEN}✓ Ollama installed${NC}"
else
    echo -e "${GREEN}✓ Ollama already installed: $(ollama --version)${NC}"
fi

echo ""
echo "⬇️  Downloading LLaMA 3.1 8B model..."
echo "This may take 10-30 minutes depending on your connection..."
ollama pull llama3.1:8b || echo -e "${YELLOW}⚠️  Model download failed. Please run 'ollama pull llama3.1:8b' manually.${NC}"

echo ""
echo "📦 Installing Node.js dependencies..."

cd scraper
echo "Installing scraper dependencies..."
npm install
cd ..

cd backend-api
echo "Installing backend-api dependencies..."
npm install
cd ..

cd webapp
echo "Installing webapp dependencies..."
npm install
cd ..

echo ""
echo "🐍 Setting up Python environment..."
cd ai-engine

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"
deactivate

cd ..

echo ""
echo "⚙️  Configuring environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Generate secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Update .env file
    sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" .env
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    
    echo -e "${GREEN}✓ Environment variables configured${NC}"
    echo -e "${YELLOW}⚠️  Please review .env file and update if needed${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping${NC}"
fi

echo ""
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis chromadb

echo "Waiting for services to be ready..."
sleep 10

echo ""
echo "🗄️  Setting up database..."
cd webapp
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
echo -e "${GREEN}✓ Database setup complete${NC}"
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Review and update .env file if needed"
echo "2. Start development with: ./scripts/start-dev.sh"
echo "3. Or start with Docker: docker-compose up -d"
echo ""
echo "🌐 Access points:"
echo "   - Frontend:  http://localhost:3000"
echo "   - Backend:   http://localhost:3001"
echo "   - AI Engine: http://localhost:8001"
echo ""
echo "👤 Default credentials:"
echo "   - Admin: admin@humanwriter.ai / admin123"
echo "   - User:  test@humanwriter.ai / test123"
echo ""
echo "🎉 Happy coding!"
