@echo off
chcp 65001 >nul
echo Restarting Backend Server...

echo Stopping current backend...
taskkill /f /im "go.exe" 2>nul

echo.
echo Starting new backend in current terminal...
cd backend
copy ..\.env.local .env.local >nul 2>&1
echo Backend configuration updated from .env.local
echo.
echo Starting Go server...
go run main.go

echo Backend restarted!
echo Backend URL: http://localhost:8080 