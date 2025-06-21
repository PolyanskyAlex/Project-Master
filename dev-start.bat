@echo off
chcp 65001 >nul
echo ================================
echo   PROJECT MASTER - DEV MODE
echo ================================
echo.

echo [1/5] Checking prerequisites...
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Go is not installed or not in PATH
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo ^> Go and Node.js are available

echo.
echo [2/5] Starting PostgreSQL (Docker only for DB)...
docker-compose up -d db
if %errorlevel% neq 0 (
    echo ERROR: Failed to start PostgreSQL
    pause
    exit /b 1
)

echo.
echo [3/5] Waiting for database...
timeout /t 3 /nobreak > nul

echo.
echo [4/5] Installing frontend dependencies...
cd frontend
if not exist node_modules (
    echo Installing npm packages...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
)
cd ..

echo.
echo [5/5] Starting services...
echo.
echo Starting Backend (Go)...
start "Backend Server" cmd /k "cd backend && copy ..\\.env.local .env && go run main.go"

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend (React)...
start "Frontend Server" cmd /k "cd frontend && set BROWSER=none && npm start"

echo.
echo ================================
echo   DEV SERVICES STARTED
echo ================================
echo ^> Backend:  http://localhost:8080
echo ^> Frontend: http://localhost:3000
echo ^> Database: localhost:5432 (Docker)
echo.
echo Opening development interface...
timeout /t 5 /nobreak > nul
start http://localhost:3000

echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping services...
taskkill /f /im "go.exe" 2>nul
taskkill /f /im "node.exe" 2>nul
docker-compose stop db

echo.
echo Development environment stopped.
pause 