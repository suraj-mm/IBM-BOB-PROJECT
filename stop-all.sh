#!/bin/bash

# Stop All Services Script
# Stops all running services of the AI Engineering Coordination Platform

set -e

echo "🛑 Stopping AI Engineering Coordination Platform..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to stop a service
stop_service() {
    local name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        PID=$(cat "$pid_file")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "Stopping $name (PID: $PID)..."
            kill $PID 2>/dev/null || true
            sleep 1
            if ps -p $PID > /dev/null 2>&1; then
                kill -9 $PID 2>/dev/null || true
            fi
            echo -e "${GREEN}✅ $name stopped${NC}"
        else
            echo -e "${RED}⚠️  $name not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${RED}⚠️  $name PID file not found${NC}"
    fi
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop services in reverse order
stop_service "Overlay UI" "logs/overlay.pid"
stop_service "Backend Engine" "logs/backend.pid"
stop_service "Gateway" "logs/gateway.pid"

echo ""
echo -e "${GREEN}🎉 All services stopped${NC}"
echo ""
echo "To start services again, run: ./start-all.sh"

# Made with Bob
