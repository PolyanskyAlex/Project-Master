@echo off
chcp 65001 >nul
echo ================================
echo   RESTARTING BACKEND SERVER
echo ================================
echo.

echo [1/2] Stopping current backend...
tasklist | findstr /i "go.exe" >nul 2>&1
if %errorlevel% equ 0 (
    taskkill /f /im go.exe >nul 2>&1
    echo ^> Backend stopped
) else (
    echo ^> Backend was not running
)

echo.
echo [2/2] Starting new backend...
cd backend
if not exist .env (
    copy ..\\.env.local .env >nul 2>&1
    echo ^> Backend configuration updated from .env.local
)
echo ^> Starting Go server in background...
start /b go run main.go
cd ..

echo.
echo ================================
echo   BACKEND RESTARTED
echo ================================
echo ^> Backend URL: http://localhost:8080 