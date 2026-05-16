# 🚀 Localhost Setup Guide

## Step-by-Step Guide to Run the Integrated System on Localhost

### Prerequisites Check

Before starting, ensure you have:

1. **Node.js 18+** installed
   - Download from: https://nodejs.org/
   - Verify: Open Command Prompt and run `node --version`

2. **Neo4j Database**
   - Option A: Docker (Recommended)
   - Option B: Neo4j Desktop

### Step 1: Install Node.js (If Not Installed)

1. Download Node.js from https://nodejs.org/
2. Install with default settings
3. Restart your terminal/command prompt
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Start Neo4j Database

#### Option A: Using Docker (Recommended)

```bash
docker run --name neo4j ^
  -p 7474:7474 -p 7687:7687 ^
  -e NEO4J_AUTH=neo4j/password ^
  neo4j:5-community
```

#### Option B: Using Neo4j Desktop

1. Download from https://neo4j.com/download/
2. Install and create a new database
3. Start the database
4. Note the connection details (default: bolt://localhost:7687)

### Step 3: Configure Environment

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` file with your settings:
   ```env
   # Backend Engine
   PORT=3000
   NODE_ENV=development
   GATEWAY_URL=http://localhost:4000

   # Neo4j Configuration
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=password

   # Repository Configuration
   REPO_PATH=C:/Users/kowshik kailas/Desktop/backend-engine/T_one

   # PostgreSQL (optional - can skip for now)
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=backend_intelligence
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=password
   ```

### Step 4: Install Dependencies

Open Command Prompt or PowerShell in the project directory:

```bash
# Install root project dependencies
npm install

# Install gateway dependencies
cd gateway
npm install
cd ..
```

### Step 5: Start Services (Manual Method)

Open **3 separate terminal windows**:

#### Terminal 1: Start Gateway
```bash
cd gateway
npm run dev
```

Wait until you see:
```
🚀 WebSocket Gateway running on 0.0.0.0:4000
```

#### Terminal 2: Start Backend Engine
```bash
npm run dev
```

Wait until you see:
```
🚀 Backend Intelligence Engine running on port 3000
✅ Connected to unified gateway
```

#### Terminal 3: Start Overlay UI
```bash
npm run dev
```

This will start the Vite dev server on http://localhost:5173

### Step 6: Verify Everything is Running

Open your browser and check:

1. **Gateway Status**: http://localhost:4000/status
   - Should show connected clients

2. **Backend Health**: http://localhost:3000/api/health
   - Should return `{"status": "healthy"}`

3. **Overlay UI**: http://localhost:5173
   - Should show the floating overlay interface

### Step 7: Test the Integration

1. Open VS Code in your project directory
2. Open a TypeScript file (e.g., `src/index.ts`)
3. Make a change and save
4. Check the terminal logs to see events flowing:
   - Gateway terminal: Should show "Event received: file_changed"
   - Backend terminal: Should show "File changed event received"
   - Overlay UI: Should display notifications

### Troubleshooting

#### Issue: "npm is not recognized"

**Solution**: 
1. Install Node.js from https://nodejs.org/
2. Restart your terminal
3. Verify with `npm --version`

#### Issue: "Port 4000 already in use"

**Solution**:
```bash
# Find what's using port 4000
netstat -ano | findstr :4000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

#### Issue: "Cannot connect to Neo4j"

**Solution**:
1. Ensure Neo4j is running
2. Check connection details in `.env`
3. Test connection: http://localhost:7474 (Neo4j Browser)

#### Issue: "Gateway won't start"

**Solution**:
1. Check if port 4000 is available
2. Look for errors in terminal
3. Ensure all dependencies are installed: `cd gateway && npm install`

#### Issue: "Backend can't connect to gateway"

**Solution**:
1. Ensure gateway is running first
2. Check `GATEWAY_URL` in `.env` is `http://localhost:4000`
3. Restart backend engine

### Alternative: Using Start Scripts

If you have Git Bash or WSL installed:

```bash
# Make scripts executable
chmod +x start-all.sh stop-all.sh

# Start all services
./start-all.sh

# Stop all services
./stop-all.sh
```

Or use the Windows batch file:
```bash
start-all.bat
```

### Viewing Logs

Logs are saved in the `logs/` directory:

```bash
# View gateway logs
type logs\gateway.log

# View backend logs
type logs\backend.log

# View overlay logs
type logs\overlay.log
```

### Quick Commands Reference

```bash
# Install all dependencies
npm install
cd gateway && npm install && cd ..

# Start gateway
cd gateway && npm run dev

# Start backend (in new terminal)
npm run dev

# Start overlay UI (in new terminal)
npm run dev

# Check health
curl http://localhost:3000/api/health
curl http://localhost:4000/status

# View logs
type logs\*.log
```

### What You Should See

When everything is running correctly:

1. **Gateway Terminal**:
   ```
   🚀 WebSocket Gateway running on 0.0.0.0:4000
   Client connected: <socket-id>
   Client <socket-id> identified as backend-engine
   ```

2. **Backend Terminal**:
   ```
   🚀 Backend Intelligence Engine running on port 3000
   ✅ Connected to unified gateway
   Initializing Intelligence Engine...
   ```

3. **Browser (http://localhost:5173)**:
   - Floating overlay window visible
   - Connection status: Connected

### Next Steps

Once everything is running:

1. Open VS Code in your project
2. Edit a TypeScript file
3. Save the file
4. Watch the logs for event flow
5. See notifications in the overlay UI

### Getting Help

If you encounter issues:

1. Check all terminals for error messages
2. Verify Neo4j is running: http://localhost:7474
3. Ensure all ports are available (3000, 4000, 5173, 7687)
4. Review logs in `logs/` directory
5. Check `INTEGRATION_ARCHITECTURE.md` for system design

### System URLs

- **Gateway**: http://localhost:4000
- **Backend API**: http://localhost:3000
- **Backend Health**: http://localhost:3000/api/health
- **Backend Stats**: http://localhost:3000/api/stats
- **Overlay UI**: http://localhost:5173
- **Neo4j Browser**: http://localhost:7474

### Success Indicators

✅ Gateway shows "WebSocket Gateway running"  
✅ Backend shows "Connected to unified gateway"  
✅ Overlay UI loads in browser  
✅ Health check returns `{"status": "healthy"}`  
✅ File changes trigger events in logs  

---

**You're now running the complete AI Engineering Coordination Platform on localhost!**