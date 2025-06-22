@echo off
chcp 65001 >nul
echo ================================
echo   PROJECT MASTER - DEV MODE
echo ================================
echo.

echo [1/7] Checking prerequisites...
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Go is not installed or not in PATH
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    exit /b 1
)

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    exit /b 1
)

echo ^> Go, Node.js and Docker are available

echo.
echo [2/7] Checking and freeing ports...
:: Проверяем порт 8080 (Backend)
netstat -an | findstr ":8080" >nul 2>&1
if %errorlevel% equ 0 (
    echo ^> Port 8080 is busy, killing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

:: Проверяем порт 3000 (Frontend)
netstat -an | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ^> Port 3000 is busy, killing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

:: Проверяем порт 3001 (дублирующий Frontend)
netstat -an | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo ^> Port 3001 is busy, killing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

echo ^> Ports 3000, 3001, 8080 are now free

echo.
echo [3/7] Stopping any existing processes...
tasklist | findstr /i "go.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo ^> Stopping existing Go processes...
    taskkill /f /im go.exe >nul 2>&1
)

wmic process where "name='node.exe' and commandline like '%%npm start%%'" get processid /value >nul 2>&1
if %errorlevel% equ 0 (
    echo ^> Stopping existing npm start processes...
    for /f "skip=1 tokens=1 delims==" %%i in ('wmic process where "name='node.exe' and commandline like '%%npm start%%'" get processid /value') do (
        taskkill /f /pid %%i >nul 2>&1
    )
)

echo ^> Previous processes cleaned up

echo.
echo [4/7] Starting PostgreSQL...
docker-compose up -d db
if %errorlevel% neq 0 (
    echo ERROR: Failed to start PostgreSQL
    exit /b 1
)

echo.
echo [5/7] Waiting for database to be ready...
timeout /t 5 /nobreak > nul

echo.
echo [6/7] Installing frontend dependencies...
cd frontend
if not exist node_modules (
    echo Installing npm packages...
    set CI=true
    set BROWSER=none
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        cd ..
        exit /b 1
    )
)

:: Создаем .env.local для отключения интерактивных запросов
echo BROWSER=none > .env.local
echo CI=true >> .env.local
echo SKIP_PREFLIGHT_CHECK=true >> .env.local
echo PORT=3000 >> .env.local
cd ..

echo.
echo [7/7] Starting services...
echo.
echo Starting Backend (Go)...
cd backend
if not exist .env (
    echo Creating backend .env file...
    echo PORT=8080 > .env
    echo DB_HOST=localhost >> .env
    echo DB_PORT=5433 >> .env
    echo DB_NAME=project_master >> .env
    echo DB_USER=postgres >> .env
    echo DB_PASSWORD=postgres >> .env
)
start /b "Project Master Backend" cmd /c "go run main.go 2>&1"
cd ..

echo Backend starting...
timeout /t 3 /nobreak > nul

echo.
echo Starting Frontend (React)...
cd frontend
start /b "Project Master Frontend" cmd /c "npm start 2>&1"
cd ..

echo Frontend starting...
timeout /t 8 /nobreak > nul

echo.
echo ================================
echo   DEV SERVICES STARTED
echo ================================
echo ^> Backend:  http://localhost:8080
echo ^> Frontend: http://localhost:3000
echo ^> Database: localhost:5433 (Docker)
echo.
echo Services are running in background windows.
echo.
echo Opening development interface...
start http://localhost:3000

echo.
echo ================================
echo Services are running in background.
echo Use 'dev-stop.bat' to stop all services.
echo Use 'dev-restart-backend.bat' to restart backend only.
echo Use 'dev-restart-frontend.bat' to restart frontend only.
echo Use 'dev-logs-all.bat' to view all logs.
echo ================================ 