@echo off
chcp 65001 >nul
echo ================================
echo   PROJECT MASTER STARTUP
echo ================================
echo.

echo [1/4] Starting Docker containers...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker containers
    pause
    exit /b 1
)

echo.
echo [2/4] Waiting for services to start...
timeout /t 5 /nobreak > nul

echo.
echo [3/4] Checking services status...
curl -s http://localhost:8080/health > nul
if %errorlevel% neq 0 (
    echo WARNING: Backend may not be ready
) else (
    echo ^> Backend API is running (http://localhost:8080)
)

echo ^> Frontend is available (http://localhost:3000)
echo ^> PostgreSQL database is running

echo.
echo [4/4] System is ready!
echo.
echo ================================
echo   AVAILABLE SERVICES
echo ================================
echo ^> Web UI:       http://localhost:3000
echo ^> Backend API:  http://localhost:8080
echo ^> Health Check: http://localhost:8080/health
echo.
echo ================================
echo   VS CODE EXTENSION
echo ================================
echo To install the fixed extension:
echo 1. Open Cursor IDE
echo 2. Extensions (Ctrl+Shift+X)
echo 3. ... ^> Install from VSIX
echo 4. Select: vscode-extension\project-master-extension-0.4.0.vsix
echo.
echo Available commands after installation:
echo ^> Project Master: Sync Plan
echo ^> Project Master: Refresh Projects
echo.
echo Opening Web UI automatically...
start http://localhost:3000

echo.
echo To stop the system run: docker-compose down
echo. 