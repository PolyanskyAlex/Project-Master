@echo off
chcp 65001 >nul
echo Restarting Backend Server...

echo Stopping current backend...
taskkill /f /im "go.exe" 2>nul

echo.
echo Starting new backend...
start "Backend Server" cmd /k "cd backend && copy ..\\.env.local .env && go run main.go"

echo Backend restarted!
echo Backend URL: http://localhost:8080 