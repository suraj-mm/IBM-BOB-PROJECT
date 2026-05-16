#!/bin/bash

# Start All Services Script
# Starts the complete AI Engineering Coordination Platform

set -e

echo "🚀 Starting AI Engineering Coordination Platform..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Neo4j is running
echo -e "${BLUE}Checking Neo4j...${NC}"
if ! nc -z localhost 7687 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Neo4j is not running on port 7687${NC}"
    echo "Please start Neo4j first:"
    echo "  docker run --name neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:5-community"
    exit 1
fi
echo -e "${GREEN}✅ Neo4j is running${NC}"
echo ""

# Start Gateway
echo -e "${BLUE}Starting WebSocket Gateway...${NC}"
cd gateway
npm install --silent 2>/dev/null || true
npm run dev > ../logs/gateway.log 2>&1 &
GATEWAY_PID=$!
echo $GATEWAY_PID > ../logs/gateway.pid
cd ..
echo -e "${GREEN}✅ Gateway started (PID: $GATEWAY_PID)${NC}"
echo "   Logs: logs/gateway.log"
echo ""

# Wait for gateway to be ready
echo "Waiting for gateway to start..."
sleep 3

# Start Backend Engine
echo -e "${BLUE}Starting Backend Intelligence Engine...${NC}"
npm install --silent 2>/dev/null || true
npm run dev > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > logs/backend.pid
echo -e "${GREEN}✅ Backend Engine started (PID: $BACKEND_PID)${NC}"
echo "   Logs: logs/backend.log"
echo ""

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 3

# Start Overlay UI
echo -e "${BLUE}Starting Floating Overlay UI...${NC}"
npm run dev > logs/overlay.log 2>&1 &
OVERLAY_PID=$!
echo $OVERLAY_PID > logs/overlay.pid
echo -e "${GREEN}✅ Overlay UI started (PID: $OVERLAY_PID)${NC}"
echo "   Logs: logs/overlay.log"
echo ""

echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo ""
echo "Services:"
echo "  📡 Gateway:        http://localhost:4000"
echo "  🧠 Backend Engine: http://localhost:3000"
echo "  🎨 Overlay UI:     http://localhost:5173"
echo ""
echo "To stop all services, run: ./stop-all.sh"
echo "To view logs, run: tail -f logs/*.log"
echo ""
echo "VS Code Extension will auto-connect when you open VS Code"

# Made with Bob
