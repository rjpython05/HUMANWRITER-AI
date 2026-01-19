#!/bin/bash

set -e

echo "🚀 Starting HumanWriter AI in development mode..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Docker services are running
echo "🐳 Checking Docker services..."
docker-compose ps postgres redis chromadb || {
    echo -e "${YELLOW}Starting Docker services...${NC}"
    docker-compose up -d postgres redis chromadb
    sleep 5
}

echo -e "${GREEN}✓ Docker services running${NC}"
echo ""

# Check if Ollama is running
echo "🤖 Checking Ollama..."
if ! pgrep -x "ollama" > /dev/null; then
    echo -e "${YELLOW}Starting Ollama service...${NC}"
    ollama serve > /dev/null 2>&1 &
    sleep 3
fi
echo -e "${GREEN}✓ Ollama running${NC}"
echo ""

# Start services in separate terminals using tmux (if available)
if command -v tmux &> /dev/null; then
    echo "📺 Starting services in tmux session..."
    
    # Create tmux session
    tmux new-session -d -s humanwriter
    
    # Window 1: Backend API
    tmux rename-window -t humanwriter:0 'backend'
    tmux send-keys -t humanwriter:0 'cd backend-api && npm run dev' C-m
    
    # Window 2: AI Engine
    tmux new-window -t humanwriter:1 -n 'ai-engine'
    tmux send-keys -t humanwriter:1 'cd ai-engine && source venv/bin/activate && python src/main.py' C-m
    
    # Window 3: Frontend
    tmux new-window -t humanwriter:2 -n 'frontend'
    tmux send-keys -t humanwriter:2 'cd webapp && npm run dev' C-m
    
    # Window 4: Logs
    tmux new-window -t humanwriter:3 -n 'logs'
    tmux send-keys -t humanwriter:3 'docker-compose logs -f' C-m
    
    echo -e "${GREEN}✓ All services started in tmux session 'humanwriter'${NC}"
    echo ""
    echo "📝 To attach to the session: tmux attach -t humanwriter"
    echo "📝 To switch windows: Ctrl+B then window number (0-3)"
    echo "📝 To detach: Ctrl+B then D"
    echo "📝 To kill session: tmux kill-session -t humanwriter"
    echo ""
    
    # Attach to session
    tmux attach -t humanwriter
    
else
    echo -e "${YELLOW}tmux not found. Starting services sequentially...${NC}"
    echo "Consider installing tmux for better development experience."
    echo ""
    
    # Start Backend API in background
    echo "Starting Backend API..."
    cd backend-api && npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Start AI Engine in background
    echo "Starting AI Engine..."
    cd ai-engine && source venv/bin/activate && python src/main.py > ../logs/ai-engine.log 2>&1 &
    AI_ENGINE_PID=$!
    cd ..
    
    # Start Frontend (foreground)
    echo "Starting Frontend..."
    cd webapp && npm run dev
    
    # Cleanup on exit
    trap "kill $BACKEND_PID $AI_ENGINE_PID" EXIT
fi
