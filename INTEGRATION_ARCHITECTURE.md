# Integration Architecture

## 🎯 Overview

This document describes the unified integration architecture for the real-time AI engineering coordination platform. The system connects four major subsystems into one cohesive real-time platform.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED WEBSOCKET GATEWAY                     │
│                      (Port 4000)                                 │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Event Router │  │ Event Queue  │  │ Connection   │          │
│  │              │  │              │  │ Manager      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
           │                │                │                │
           ▼                ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ VS Code  │    │ Backend  │    │   AI     │    │ Floating │
    │Extension │    │ Engine   │    │  Engine  │    │ Overlay  │
    │          │    │          │    │          │    │   UI     │
    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

## 📡 Communication Flow

### 1. Developer Edits Code

```
Developer types in VS Code
         ↓
VS Code Extension detects file change
         ↓
Extension sends 'file_changed' event to Gateway
         ↓
Gateway routes event to Backend Engine
```

### 2. Backend Analysis

```
Backend Engine receives 'file_changed' event
         ↓
Parses file with AST parser
         ↓
Updates dependency graph in Neo4j
         ↓
Detects breaking changes
         ↓
Analyzes impact on other files
         ↓
Emits structured intelligence events:
  - 'breaking-api-change'
  - 'dependency-risk'
  - 'affected-modules'
  - 'contract-violation'
         ↓
Gateway routes events to AI Engine + Overlay UI
```

### 3. AI Risk Analysis

```
AI Engine receives intelligence events
         ↓
Performs semantic reasoning
         ↓
Calculates merge risk scores
         ↓
Generates actionable suggestions
         ↓
Emits AI events:
  - 'merge_risk_detected'
  - 'ai_suggestion_generated'
  - 'parallel_implementation_detected'
         ↓
Gateway routes events to Overlay UI
```

### 4. Real-Time Alerts

```
Overlay UI receives events
         ↓
Displays floating notifications
         ↓
Shows risk indicators
         ↓
Presents actionable suggestions
         ↓
Developer takes action
```

## 🔌 Subsystem Integration

### VS Code Extension Integration

**Location**: `agent/` directory

**Responsibilities**:
- Monitor active file changes
- Track git branch
- Detect repo context
- Send editor events to gateway

**Events Sent**:
- `file_changed` - When a file is modified
- `file_saved` - When a file is saved
- `branch_changed` - When git branch changes
- `editor_context` - Active editor state

**Connection**:
```javascript
// agent/socket/index.js
const socket = io('http://localhost:4000');

socket.emit('identify', {
  subsystem: 'vscode-extension',
  metadata: { /* ... */ }
});

socket.emit('event', {
  eventType: 'file_changed',
  payload: { filePath, repo, branch }
});
```

### Backend Intelligence Engine Integration

**Location**: `src/` directory

**Responsibilities**:
- Parse TypeScript/JavaScript code
- Build dependency graphs
- Detect breaking changes
- Analyze impact
- Emit intelligence events

**Events Received**:
- `file_changed` - Triggers analysis
- `editor_context` - Updates context

**Events Sent**:
- `breaking-api-change` - API contract violations
- `dependency-risk` - High impact changes
- `affected-modules` - Impacted files
- `contract-violation` - Type/interface changes

**Connection**:
```typescript
// src/gateway/gateway-client.ts
const gatewayClient = new GatewayClient('http://localhost:4000');
await gatewayClient.connect();

// Listen for VS Code events
gatewayClient.on('file_changed', async (event) => {
  await engine.analyze({
    repo: event.payload.repo,
    changedFiles: [event.payload.filePath]
  });
});

// Send intelligence events
gatewayClient.sendEvent({
  eventType: 'breaking-api-change',
  payload: { /* ... */ }
});
```

### AI Risk Engine Integration

**Location**: External Python service (to be connected)

**Responsibilities**:
- Semantic code analysis
- Merge risk prediction
- Suggestion generation
- Developer impact scoring

**Events Received**:
- `breaking-api-change`
- `dependency-risk`
- `affected-modules`
- `contract-violation`

**Events Sent**:
- `merge_risk_detected`
- `ai_suggestion_generated`
- `parallel_implementation_detected`
- `integration_warning`

**Connection** (Python):
```python
import socketio

sio = socketio.Client()
sio.connect('http://localhost:4000')

sio.emit('identify', {
    'subsystem': 'ai-engine',
    'metadata': {'version': '1.0.0'}
})

@sio.on('breaking-api-change')
def handle_breaking_change(data):
    # Analyze and generate suggestions
    risk_score = analyze_risk(data)
    sio.emit('event', {
        'eventType': 'merge_risk_detected',
        'payload': {'riskScore': risk_score}
    })
```

### Floating Overlay UI Integration

**Location**: `src/` (React components) + `electron/` (Electron app)

**Responsibilities**:
- Display real-time notifications
- Show risk indicators
- Present suggestions
- Visualize dependencies

**Events Received**:
- `breaking-api-change`
- `dependency-risk`
- `affected-modules`
- `merge_risk_detected`
- `ai_suggestion_generated`

**Connection**:
```javascript
// src/services/socketClient.js
const socket = io('http://localhost:4000');

socket.emit('identify', {
  subsystem: 'overlay-ui',
  metadata: {}
});

socket.on('event', (event) => {
  if (event.eventType === 'merge_risk_detected') {
    addNotification({
      title: 'Merge Risk',
      severity: event.severity,
      message: event.payload.reasoning
    });
  }
});
```

## 📋 Shared Event Contracts

All subsystems use the same event structure defined in `shared/types/events.ts`:

```typescript
interface IntelligenceEvent {
  eventId: string;
  eventType: EventType;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: EventSource;
  payload: EventPayload;
}
```

### Event Types

**VS Code Extension Events**:
- `file_changed`
- `file_saved`
- `branch_changed`
- `editor_context`

**Backend Intelligence Events**:
- `breaking-api-change`
- `dependency-risk`
- `affected-modules`
- `contract-violation`
- `api_contract_changed`

**AI Risk Engine Events**:
- `merge_risk_detected`
- `ai_suggestion_generated`
- `parallel_implementation_detected`
- `integration_warning`

**System Events**:
- `system_ready`
- `connection_established`
- `connection_lost`
- `heartbeat`

## 🔄 Event Routing Rules

The gateway automatically routes events based on type:

| Event Type | Routed To |
|------------|-----------|
| `file_changed` | Backend Engine, AI Engine |
| `breaking-api-change` | AI Engine, Overlay UI |
| `dependency-risk` | AI Engine, Overlay UI |
| `merge_risk_detected` | Overlay UI |
| `ai_suggestion_generated` | Overlay UI |

## 🛡️ Fault Tolerance

### Reconnection Strategy

All clients implement automatic reconnection:

```typescript
{
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  backoffMultiplier: 1.5
}
```

### Event Queuing

The gateway queues events for offline clients:

- Max queue size: 1000 events per subsystem
- Retry attempts: 3
- Events are flushed when client reconnects

### Heartbeat Monitoring

- Heartbeat interval: 12 seconds
- Timeout: 30 seconds
- Automatic disconnection on timeout

## 🚀 Deployment

### 1. Start the Gateway

```bash
cd gateway
npm install
npm run dev
```

Gateway runs on `http://localhost:4000`

### 2. Start Backend Engine

```bash
npm install
npm run dev
```

Backend engine:
- HTTP API: `http://localhost:3000`
- Connects to gateway automatically

### 3. Start VS Code Extension

The extension connects automatically when VS Code starts.

### 4. Start Overlay UI

```bash
npm run dev  # Vite dev server
npm run electron:dev  # Electron app
```

### 5. Connect AI Engine

Python AI engine connects to gateway on startup.

## 📊 Monitoring

### Gateway Status

```bash
# Check connected clients
GET http://localhost:4000/status

# Response:
{
  "connectedClients": 4,
  "subsystems": {
    "vscode-extension": 1,
    "backend-engine": 1,
    "ai-engine": 1,
    "overlay-ui": 1
  },
  "queuedEvents": 0
}
```

### Backend Engine Status

```bash
GET http://localhost:3000/api/health

# Response:
{
  "status": "healthy",
  "gatewayConnected": true,
  "neo4jConnected": true
}
```

## 🔧 Configuration

### Environment Variables

**Gateway** (`.env`):
```env
GATEWAY_PORT=4000
GATEWAY_HOST=0.0.0.0
DEBUG=false
```

**Backend Engine** (`.env`):
```env
PORT=3000
GATEWAY_URL=http://localhost:4000
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
REPO_PATH=/path/to/repo
```

**VS Code Extension**:
```json
{
  "aiCoordination.gatewayUrl": "http://localhost:4000"
}
```

## 🎯 Integration Checklist

- [x] Shared event contracts created
- [x] Unified WebSocket gateway implemented
- [x] Backend engine connected to gateway
- [ ] VS Code extension updated to use gateway
- [ ] AI engine connected to gateway
- [ ] Overlay UI connected to gateway
- [ ] Event routing tested end-to-end
- [ ] Fault tolerance verified
- [ ] Documentation complete

## 🔍 Debugging

### Enable Debug Logging

**Gateway**:
```bash
DEBUG=true npm run dev
```

**Backend Engine**:
```bash
NODE_ENV=development npm run dev
```

### Monitor Events

Connect a debug client to see all events:

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:4000');

socket.on('event', (event) => {
  console.log('Event:', event.eventType, event.payload);
});
```

## 📝 Next Steps

1. **Update VS Code Extension**: Modify `agent/socket/index.js` to use new event format
2. **Connect AI Engine**: Create Python client using `python-socketio`
3. **Update Overlay UI**: Use new event types in React components
4. **Add Metrics**: Implement event tracking and performance monitoring
5. **Add Tests**: Create integration tests for event flow

## 🤝 Contributing

When adding new features:

1. Define event types in `shared/types/events.ts`
2. Add routing rules in `gateway/event-router.ts`
3. Update this documentation
4. Test end-to-end integration

---

**Made with Bob** - Real-time AI Engineering Coordination Platform