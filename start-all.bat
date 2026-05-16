@echo off
REM Start All Services Script for Windows
REM Starts the complete AI Engineering Coordination Platform

echo Starting AI Engineering Coordination Platform...
echo.

REM Check if Neo4j is running
echo Checking Neo4j...
netstat -an | find "7687" >nul
if errorlevel 1 (
    echo WARNING: Neo4j is not running on port 7687
    echo Please start Neo4j first:
    echo   docker run --name neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:5-community
    pause
    exit /b 1
)
echo Neo4j is running
echo.

REM Create logs directory
if not exist logs mkdir logs

REM Start Gateway
echo Starting WebSocket Gateway...
cd gateway
start /B cmd /c "npm run dev > ..\logs\gateway.log 2>&1"
cd ..
echo Gateway started
echo   Logs: logs\gateway.log
echo.

REM Wait for gateway
timeout /t 3 /nobreak >nul

REM Start Backend Engine
echo Starting Backend Intelligence Engine...
start /B cmd /c "npm run dev > logs\backend.log 2>&1"
echo Backend Engine started
echo   Logs: logs\backend.log
echo.

REM Wait for backend
timeout /t 3 /nobreak >nul

REM Start Overlay UI
echo Starting Floating Overlay UI...
start /B cmd /c "npm run dev > logs\overlay.log 2>&1"
echo Overlay UI started
echo   Logs: logs\overlay.log
echo.

echo All services started successfully!
echo.
echo Services:
echo   Gateway:        http://localhost:4000
echo   Backend Engine: http://localhost:3000
echo   Overlay UI:     http://localhost:5173
echo.
echo To stop all services, run: stop-all.bat
echo To view logs, check the logs\ directory
echo.
echo VS Code Extension will auto-connect when you open VS Code
echo.
pause

@REM Made with Bob
