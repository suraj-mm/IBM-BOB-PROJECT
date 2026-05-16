# Backend Intelligence Engine

A real-time AI engineering coordination system that detects how code changes from one developer affect other developers.

## 🎯 Core Mission

**"If this code changes, what else breaks?"**

The system understands TypeScript codebases, detects API/schema/function changes, builds dependency relationships, tracks API contracts, identifies affected files/modules, and emits structured events for alerts.

## 🏗️ Architecture

### Core Modules

1. **AST Parser** (`src/parser/ast-parser.ts`)
   - Parses TypeScript files using ts-morph
   - Extracts functions, classes, interfaces, imports, exports

2. **Import/Dependency Analyzer** (`src/parser/dependency-analyzer.ts`)
   - Detects file-to-file dependencies
   - Builds dependency relationships
   - Finds circular dependencies

3. **API Contract Tracker** (`src/contracts/api-extractor.ts`)
   - Extracts Fastify/Express routes
   - Tracks request/response schemas
   - Detects breaking contract changes

4. **Change Detector** (`src/parser/change-detector.ts`)
   - Compares old vs new code using git diff
   - Detects renamed fields, removed parameters, changed interfaces
   - Identifies breaking changes

5. **Dependency Graph Builder** (`src/graph/graph-builder.ts`)
   - Builds graph relationships in Neo4j
   - Maps frontend → API → service → database
   - Enables transitive dependency queries

6. **Impact Analyzer** (`src/impact/impact-analyzer.ts`)
   - **Main intelligence module**
   - Determines affected files/modules when code changes
   - Calculates impact scores
   - Generates recommendations

7. **Event Engine** (`src/events/event-emitter.ts`)
   - Emits structured events:
     - `breaking-api-change`
     - `dependency-risk`
     - `affected-modules`
     - `contract-violation`
   - Outputs clean JSON events

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Neo4j 5.x
- PostgreSQL 14+ (optional, for future use)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# - Set REPO_PATH to your codebase
# - Configure Neo4j credentials
```

### Configuration

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# Repository Configuration
REPO_PATH=/path/to/your/repo
```

### Running

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## 📡 API Endpoints

### POST /api/analyze

Analyze code changes and get impact report.

**Request:**
```json
{
  "repo": "auth-service",
  "branch": "main",
  "changedFiles": [
    "backend/auth.ts",
    "backend/user.ts"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "analysisId": "analysis-1234567890-abc123",
  "events": [
    {
      "eventId": "uuid",
      "eventType": "breaking-api-change",
      "severity": "high",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "source": {
        "repo": "auth-service",
        "changedFiles": ["backend/auth.ts"]
      },
      "payload": {
        "changes": [...],
        "affectedFiles": ["frontend/login.tsx"],
        "breakingChanges": [...],
        "recommendations": [...]
      }
    }
  ],
  "summary": {
    "totalChanges": 5,
    "breakingChanges": 2,
    "affectedFiles": 8,
    "highSeverityIssues": 1
  }
}
```

### GET /api/stats

Get dependency graph statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalFiles": 150,
    "totalDependencies": 320,
    "totalFunctions": 450,
    "totalApiRoutes": 45
  }
}
```

### GET /api/circular-dependencies

Find circular dependencies in the codebase.

**Response:**
```json
{
  "success": true,
  "cycles": [
    ["src/a.ts", "src/b.ts", "src/a.ts"],
    ["src/x.ts", "src/y.ts", "src/z.ts", "src/x.ts"]
  ],
  "count": 2
}
```

### POST /api/rebuild-graph

Rebuild the entire dependency graph.

**Response:**
```json
{
  "success": true,
  "message": "Dependency graph rebuilt successfully"
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "backend-intelligence-engine"
}
```

## 🔌 WebSocket Events

Connect to `ws://localhost:3000/ws/events` to receive real-time intelligence events.

**Event Types:**
- `breaking-api-change` - API contract violations detected
- `dependency-risk` - High number of affected files
- `affected-modules` - List of impacted modules
- `contract-violation` - Type/interface contract changes

**Example Event:**
```json
{
  "eventId": "uuid",
  "eventType": "breaking-api-change",
  "severity": "high",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "source": {
    "repo": "auth-service",
    "changedFiles": ["backend/auth.ts"]
  },
  "payload": {
    "changes": [...],
    "affectedFiles": ["frontend/login.tsx"],
    "recommendations": [...]
  }
}
```

## 🧪 Testing

```bash
# Run tests
npm test
```

## 📊 Expected Flow

```
Backend API changes
↓
System detects contract modification
↓
Dependency graph identifies consumers
↓
Impact analyzer finds affected files
↓
Structured event emitted
↓
WebSocket clients receive real-time notification
```

## 🛠️ Tech Stack

- **Node.js** - Runtime
- **TypeScript** - Language
- **Fastify** - Web framework
- **ts-morph** - TypeScript AST parsing
- **simple-git** - Git operations
- **Neo4j** - Graph database for dependencies
- **WebSockets** - Real-time events

## 📁 Project Structure

```
/backend-engine
  /src
    /parser          # AST parsing and dependency analysis
    /contracts       # API contract tracking
    /graph           # Neo4j graph operations
    /impact          # Impact analysis (core intelligence)
    /events          # Event emission
    /routes          # HTTP routes
    /engine          # Main orchestrator
    /utils           # Utilities
    /types           # TypeScript types
  package.json
  tsconfig.json
  README.md
```

## 🎯 Design Principles

- **Modular**: Each module has a single responsibility
- **Deterministic**: No AI reasoning yet, pure code intelligence
- **Incremental**: Build features step by step
- **Simple**: Avoid overengineering
- **Typed**: Strong TypeScript typing throughout

## 🚧 Future Enhancements

- PostgreSQL integration for historical analysis
- Semantic code analysis
- Multi-language support (Python, Java, etc.)
- Integration with Slack/Jira
- AI-powered recommendations
- Developer impact scoring

## 📝 License

MIT

## 🤝 Contributing

This is a focused backend intelligence engine. Contributions should align with the core mission: detecting code change impacts.

**DO NOT add:**
- Frontend UI
- Electron overlays
- VS Code extensions
- Authentication systems
- Unrelated AI features

**DO add:**
- Better change detection
- More accurate impact analysis
- Performance improvements
- Additional language support (future)