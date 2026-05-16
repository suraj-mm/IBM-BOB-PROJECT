# Deployment Guide

## 🚀 Quick Start

This guide will help you deploy the integrated AI engineering coordination platform.

## 📋 Prerequisites

- Node.js 18+ 
- Neo4j 5.x (running on `bolt://localhost:7687`)
- PostgreSQL 14+ (optional, for future features)
- Python 3.9+ (for AI engine)

## 🔧 Installation

### 1. Install Dependencies

```bash
# Root project (Backend Engine)
npm install

# Gateway
cd gateway
npm install
cd ..

# Overlay UI (if separate)
# Already included in root package.json
```

### 2. Configure Environment

Create `.env` file in root:

```env
# Backend Engine
PORT=3000
NODE_ENV=development
GATEWAY_URL=http://localhost:4000

# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# Repository Configuration
REPO_PATH=/path/to/your/repo

# PostgreSQL (optional)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=backend_intelligence
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

Create `gateway/.env`:

```env
GATEWAY_PORT=4000
GATEWAY_HOST=0.0.0.0
DEBUG=false
```

### 3. Start Neo4j

```bash
# Using Docker
docker run \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/your_password \
  neo4j:5-community

# Or start your local Neo4j instance
```

## 🎯 Deployment Steps

### Step 1: Start the Gateway

The gateway must start first as all other services connect to it.

```bash
cd gateway
npm run dev
```

You should see:
```
🚀 WebSocket Gateway running on 0.0.0.0:4000
📡 Listening on ws://0.0.0.0:4000
🔗 Subsystems can now connect
```

### Step 2: Start Backend Intelligence Engine

```bash
# From root directory
npm run dev
```

You should see:
```
🚀 Backend Intelligence Engine running on port 3000
✅ Connected to unified gateway
📊 Health check: http://localhost:3000/api/health
```

### Step 3: Start Overlay UI (Electron App)

```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Electron
npm run electron:dev
```

The floating overlay window should appear on your screen.

### Step 4: Install VS Code Extension

The VS Code extension is in the `agent/` directory and connects automatically when VS Code starts.

```bash
# The extension will auto-connect to gateway
# Check VS Code output panel for connection status
```

### Step 5: Connect AI Engine (Optional)

If you have a Python AI engine:

```bash
cd ai-engine
pip install python-socketio
python main.py
```

## 🔍 Verification

### Check Gateway Status

```bash
curl http://localhost:4000/status
```

Expected response:
```json
{
  "connectedClients": 3,
  "subsystems": {
    "backend-engine": 1,
    "overlay-ui": 1,
    "vscode-extension": 1
  }
}
```

### Check Backend Engine

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "backend-intelligence-engine"
}
```

### Test End-to-End Flow

1. Open a TypeScript file in VS Code
2. Make a change (e.g., modify a function signature)
3. Save the file
4. Check the floating overlay for notifications
5. Check backend logs for analysis events

## 📊 Monitoring

### Gateway Logs

```bash
cd gateway
npm run dev
```

Watch for:
- `Client connected: <id>`
- `Client <id> identified as <subsystem>`
- `Event received: <type> from <id>`

### Backend Engine Logs

```bash
npm run dev
```

Watch for:
- `✅ Connected to unified gateway`
- `📥 Received event: file_changed`
- `📤 Sent event: breaking-api-change`

### Overlay UI Logs

Check Electron DevTools (Ctrl+Shift+I):
- WebSocket connection status
- Incoming events
- Notification rendering

## 🐛 Troubleshooting

### Gateway Won't Start

**Problem**: Port 4000 already in use

**Solution**:
```bash
# Find process using port 4000
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows

# Kill the process or change GATEWAY_PORT in .env
```

### Backend Engine Can't Connect to Gateway

**Problem**: `Connection error` in logs

**Solution**:
1. Ensure gateway is running first
2. Check `GATEWAY_URL` in `.env`
3. Verify no firewall blocking port 4000

### Neo4j Connection Failed

**Problem**: `Failed to connect to Neo4j`

**Solution**:
1. Ensure Neo4j is running: `docker ps` or check Neo4j Desktop
2. Verify credentials in `.env`
3. Test connection: `bolt://localhost:7687`

### VS Code Extension Not Connecting

**Problem**: No events from VS Code

**Solution**:
1. Check VS Code Output panel
2. Verify `agent/socket/index.js` has correct gateway URL
3. Restart VS Code

### Overlay UI Not Showing Notifications

**Problem**: Overlay appears but no notifications

**Solution**:
1. Check browser console for errors
2. Verify WebSocket connection in DevTools
3. Test by triggering a file change in VS Code

## 🔄 Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start gateway
cd gateway
pm2 start npm --name "gateway" -- start

# Start backend engine
cd ..
pm2 start npm --name "backend-engine" -- start

# Monitor
pm2 monit

# View logs
pm2 logs
```

### Using Docker

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  neo4j:
    image: neo4j:5-community
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      NEO4J_AUTH: neo4j/password
    volumes:
      - neo4j_data:/data

  gateway:
    build:
      context: ./gateway
    ports:
      - "4000:4000"
    environment:
      GATEWAY_PORT: 4000
      GATEWAY_HOST: 0.0.0.0

  backend-engine:
    build:
      context: .
    ports:
      - "3000:3000"
    environment:
      PORT: 3000
      GATEWAY_URL: http://gateway:4000
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_USER: neo4j
      NEO4J_PASSWORD: password
    depends_on:
      - neo4j
      - gateway

volumes:
  neo4j_data:
```

Start with:
```bash
docker-compose up -d
```

## 🔐 Security Considerations

### Production Checklist

- [ ] Change default Neo4j password
- [ ] Use environment-specific `.env` files
- [ ] Enable HTTPS for gateway (use nginx reverse proxy)
- [ ] Implement authentication for gateway connections
- [ ] Restrict CORS origins in production
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerting

### Recommended nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name gateway.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 📈 Performance Tuning

### Gateway Optimization

```typescript
// gateway/index.ts
const gateway = new WebSocketGateway({
  port: 4000,
  eventQueue: {
    maxSize: 5000,  // Increase for high-traffic
    retryAttempts: 5
  },
  heartbeat: {
    interval: 30000,  // Reduce frequency
    timeout: 60000
  }
});
```

### Backend Engine Optimization

```env
# .env
NODE_ENV=production
# Disable verbose logging
LOG_LEVEL=info
```

## 🎯 Health Checks

### Gateway Health

```bash
curl http://localhost:4000/health
```

### Backend Engine Health

```bash
curl http://localhost:3000/api/health
```

### Neo4j Health

```bash
curl http://localhost:7474/db/neo4j/tx/commit \
  -u neo4j:password \
  -H "Content-Type: application/json" \
  -d '{"statements":[{"statement":"RETURN 1"}]}'
```

## 📝 Maintenance

### Backup Neo4j Data

```bash
docker exec neo4j neo4j-admin dump \
  --database=neo4j \
  --to=/backups/neo4j-backup.dump
```

### Clear Event Queue

```bash
# Restart gateway to clear queued events
pm2 restart gateway
```

### Rebuild Dependency Graph

```bash
curl -X POST http://localhost:3000/api/rebuild-graph
```

## 🆘 Support

If you encounter issues:

1. Check logs: `pm2 logs` or `docker-compose logs`
2. Verify all services are running
3. Test connectivity between services
4. Review `INTEGRATION_ARCHITECTURE.md` for system design
5. Check GitHub issues

---

**Made with Bob** - Real-time AI Engineering Coordination Platform