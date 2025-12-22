@echo off
echo Multiplayer Game Server (SECURE WSS) Startup
echo ==============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found

REM Install dependencies if needed
if not exist ..\..\actionengine\network\server\node_modules (
    echo Installing dependencies...
    cd ..\..\actionengine\network\server
    call npm install
    cd /d "%~dp0"
)

echo.
echo Starting Secure Game server...
echo.
node ..\..\actionengine\network\server\ActionNetServerSSL.js 8000 2
pause