# PowerShell Script to Start All Services on Localhost
# Run this script to start the complete AI Engineering Coordination Platform

Write-Host "🚀 Starting AI Engineering Coordination Platform on Localhost..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""

# Check if Neo4j is running
Write-Host "Checking Neo4j connection..." -ForegroundColor Blue
$neo4jRunning = Test-NetConnection -ComputerName localhost -Port 7687 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
if (-not $neo4jRunning.TcpTestSucceeded) {
    Write-Host "⚠️  Neo4j is not running on port 7687" -ForegroundColor Yellow
    Write-Host "Please start Neo4j first:" -ForegroundColor Yellow
    Write-Host "  docker run --name neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:5-community" -ForegroundColor White
    Write-Host ""
    Write-Host "Or start Neo4j Desktop" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
} else {
    Write-Host "✅ Neo4j is running" -ForegroundColor Green
}

Write-Host ""

# Create logs directory
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env file created. Please edit it with your settings." -ForegroundColor Green
        Write-Host "Press any key to continue..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Blue

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Gray
npm install --silent 2>&1 | Out-Null

# Install gateway dependencies
Write-Host "Installing gateway dependencies..." -ForegroundColor Gray
Set-Location gateway
npm install --silent 2>&1 | Out-Null
Set-Location ..

Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Start Gateway
Write-Host "Starting WebSocket Gateway..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\gateway'; npm run dev" -WindowStyle Normal
Write-Host "✅ Gateway starting in new window" -ForegroundColor Green
Write-Host "   URL: http://localhost:4000" -ForegroundColor Gray

Start-Sleep -Seconds 3

# Start Backend Engine
Write-Host ""
Write-Host "Starting Backend Intelligence Engine..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal
Write-Host "✅ Backend Engine starting in new window" -ForegroundColor Green
Write-Host "   URL: http://localhost:3000" -ForegroundColor Gray

Start-Sleep -Seconds 3

# Start Overlay UI
Write-Host ""
Write-Host "Starting Floating Overlay UI..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal
Write-Host "✅ Overlay UI starting in new window" -ForegroundColor Green
Write-Host "   URL: http://localhost:5173" -ForegroundColor Gray

Write-Host ""
Write-Host "🎉 All services are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "  📡 Gateway:        http://localhost:4000" -ForegroundColor White
Write-Host "  🧠 Backend Engine: http://localhost:3000" -ForegroundColor White
Write-Host "  🎨 Overlay UI:     http://localhost:5173" -ForegroundColor White
Write-Host "  🗄️  Neo4j Browser:  http://localhost:7474" -ForegroundColor White
Write-Host ""
Write-Host "Wait 10-15 seconds for all services to fully start..." -ForegroundColor Yellow
Write-Host ""
Write-Host "To verify:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:3000/api/health" -ForegroundColor White
Write-Host "  2. Should return: {`"status`": `"healthy`"}" -ForegroundColor White
Write-Host ""
Write-Host "To stop all services, close the PowerShell windows" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Made with Bob
