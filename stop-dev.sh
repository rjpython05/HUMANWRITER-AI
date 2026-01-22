#!/bin/bash

# HUMANWRITER AI - Stop Development Services

echo "🛑 Stopping HUMANWRITER AI Development Environment"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

cd /home/user/HUMANWRITER-AI

# Stop Node.js processes
if [ -f logs/frontend.pid ]; then
    PID=$(cat logs/frontend.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping Frontend (PID: $PID)..."
        kill $PID
    fi
    rm logs/frontend.pid
fi

if [ -f logs/backend.pid ]; then
    PID=$(cat logs/backend.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping Backend (PID: $PID)..."
        kill $PID
    fi
    rm logs/backend.pid
fi

if [ -f logs/ai-engine.pid ]; then
    PID=$(cat logs/ai-engine.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "Stopping AI Engine (PID: $PID)..."
        kill $PID
    fi
    rm logs/ai-engine.pid
fi

# Stop Docker containers (optional - comment out if you want to keep them running)
# echo "Stopping Docker containers..."
# docker stop humanwriter-postgres humanwriter-redis 2>/dev/null || true

echo -e "${GREEN}✅ All services stopped${NC}"
