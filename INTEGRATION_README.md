# 🚀 Unified AI Engineering Coordination Platform

## Overview

This is a **real-time AI engineering coordination platform** that connects four major subsystems into one cohesive system:

1. **VS Code Extension** - Monitors live coding activity
2. **Backend Intelligence Engine** - Analyzes code dependencies and impact
3. **AI Risk Engine** - Predicts merge risks and generates suggestions
4. **Floating Overlay UI** - Displays real-time alerts and intelligence

## 🎯 What It Does

The platform automatically:

- ✅ Monitors your coding activity in real-time
- ✅ Detects API/schema/function changes
- ✅ Identifies affected developers and modules
- ✅ Predicts merge and integration risks
- ✅ Provides actionable suggestions
- ✅ Displays alerts in a floating overlay
- ✅ Operates with minimal latency

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              UNIFIED WEBSOCKET GATEWAY                       │
│                   (Port 4000)                                │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
   ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌──────────┐
   │ VS Code │   │ Backend  │   │   AI    │   │ Floating │
   │Extension│   │  Engine  │   │ Engine  │   │ Overlay  │
   └─────────┘   └──────────┘   └─────────┘   └──────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Neo4j 5.x
- VS Code

### 1. Start Neo4j

```bash
docker run --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:5-community
```

### 2. Configure Environment

Create `.env` file:

```env
PORT=3000
GATEWAY_URL=http://localhost:4000
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
REPO_PATH=/path/to/your/repo
```

### 3. Start All Services

**Linux/macOS:**
```bash
chmod +x start-all.sh
./start-all.sh
```

**Windows:**
```bash
start-all.bat
```

### 4. Verify

Open http://localhost:3000/api/health - should return:
```json
{
  "status": "healthy",
  "gatewayConnected": true
}
```

## 📊 Real-Time Flow

```
Developer edits code in VS Code
         ↓
VS Code Extension detects change
         ↓
Event sent to Gateway
         ↓
Backend Engine analyzes impact
         ↓
AI Engine generates suggestions
         ↓
Floating Overlay displays alert
         ↓
Developer sees actionable guidance
```

## 🔌 Integration Points

### VS Code Extension → Gateway

```javascript
// Sends file change events
socket.emit('event', {
  eventType: 'file_changed',
  payload: {
    filePath: 'src/api/users.ts',
    repo: 'backend-service',
    branch: 'feature/auth'
  }
});
```

### Backend Engine → Gateway

```typescript
// Sends intelligence events
gatewayClient.sendEvent({
  eventType: 'breaking-api-change',
  severity: 'high',
  payload: {
    affectedFiles: ['frontend/login.tsx'],
    recommendations: ['Update API client']
  }
});
```

### AI Engine → Gateway

```python
# Sends risk analysis
sio.emit('event', {
    'eventType': 'merge_risk_detected',
    'severity': 'high',
    'payload': {
        'riskScore': 85,
        'reasoning': 'Conflicting changes detected'
    }
})
```

### Gateway → Overlay UI

```javascript
// Receives all events
socket.on('event', (event) => {
  if (event.eventType === 'merge_risk_detected') {
    showNotification(event.payload);
  }
});
```

## 📡 Event Types

### From VS Code Extension
- `file_changed` - File modified
- `file_saved` - File saved
- `branch_changed` - Git branch switched
- `editor_context` - Active editor state

### From Backend Engine
- `breaking-api-change` - API contract violation
- `dependency-risk` - High impact change
- `affected-modules` - Impacted files
- `contract-violation` - Type/interface change

### From AI Engine
- `merge_risk_detected` - Merge conflict risk
- `ai_suggestion_generated` - Actionable suggestion
- `parallel_implementation_detected` - Team overlap
- `integration_warning` - Integration issue

## 🛠️ Development

### Project Structure

```
/
├── gateway/                 # Unified WebSocket Gateway
│   ├── websocket-gateway.ts
│   ├── event-router.ts
│   └── event-queue.ts
├── shared/                  # Shared event contracts
│   └── types/
│       └── events.ts
├── src/                     # Backend Intelligence Engine
│   ├── engine/
│   ├── parser/
│   ├── graph/
│   ├── impact/
│   └── gateway/
│       └── gateway-client.ts
├── agent/                   # VS Code Extension
│   ├── socket/
│   └── watcher/
├── electron/                # Floating Overlay (Electron)
└── src/components/          # Overlay UI (React)
```

### Running Individual Services

**Gateway:**
```bash
cd gateway
npm run dev
```

**Backend Engine:**
```bash
npm run dev
```

**Overlay UI:**
```bash
npm run dev  # Vite
npm run electron:dev  # Electron
```

## 🔍 Monitoring

### Check Connected Clients

```bash
curl http://localhost:4000/status
```

### View Backend Stats

```bash
curl http://localhost:3000/api/stats
```

### Watch Logs

```bash
tail -f logs/*.log
```

## 🐛 Troubleshooting

### Gateway Won't Start

**Issue:** Port 4000 in use

**Fix:**
```bash
# Find and kill process
lsof -i :4000  # macOS/Linux
netstat -ano | findstr :4000  # Windows
```

### Backend Can't Connect

**Issue:** Connection refused

**Fix:**
1. Ensure gateway is running first
2. Check `GATEWAY_URL` in `.env`
3. Verify firewall settings

### No Events Flowing

**Issue:** Services connected but no events

**Fix:**
1. Check VS Code Output panel
2. Verify file watcher is active
3. Test with manual file change
4. Check gateway logs for routing

## 📚 Documentation

- [Integration Architecture](./INTEGRATION_ARCHITECTURE.md) - Complete system design
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production deployment
- [API Documentation](./docs/API.md) - REST API reference
- [Usage Examples](./USAGE_EXAMPLES.md) - Code examples

## 🎯 Key Features

### Real-Time Coordination
- Sub-second event propagation
- WebSocket-based communication
- Automatic reconnection handling

### Intelligent Analysis
- AST-based code parsing
- Dependency graph building
- Impact analysis
- Breaking change detection

### AI-Powered Insights
- Merge risk prediction
- Actionable suggestions
- Developer impact scoring
- Semantic reasoning

### Developer Experience
- Always-on-top floating overlay
- Non-intrusive notifications
- Contextual alerts
- Clean, modern UI

## 🔐 Security

- Event validation
- Connection authentication (optional)
- Rate limiting support
- CORS configuration
- Secure WebSocket (WSS) ready

## 📈 Performance

- Lightweight event protocol
- Efficient message routing
- Event queuing for offline clients
- Debounced file watching
- Incremental graph updates

## 🤝 Contributing

When adding features:

1. Define events in `shared/types/events.ts`
2. Add routing rules in `gateway/event-router.ts`
3. Update documentation
4. Test end-to-end flow

## 📝 License

MIT

## 🙏 Acknowledgments

Built with:
- Socket.IO - Real-time communication
- Fastify - High-performance HTTP
- Neo4j - Graph database
- ts-morph - TypeScript AST parsing
- React + Electron - Overlay UI

---

**Made with Bob** - Transforming isolated modules into a unified real-time platform

## 🚦 Status

- ✅ Shared event contracts
- ✅ Unified WebSocket gateway
- ✅ Backend engine integration
- ✅ Event routing system
- ✅ Fault tolerance
- ⏳ VS Code extension update
- ⏳ AI engine connection
- ⏳ Overlay UI integration

## 📞 Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review [INTEGRATION_ARCHITECTURE.md](./INTEGRATION_ARCHITECTURE.md)
3. Verify all services are running
4. Test connectivity between services

---

**Next Steps:**
1. Run `./start-all.sh` (or `.bat` on Windows)
2. Open VS Code and edit a file
3. Watch the floating overlay for alerts
4. Check backend logs for analysis events