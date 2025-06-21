@echo off
chcp 65001 >nul
echo Restarting Frontend Server...

echo Stopping current frontend...
taskkill /f /im "node.exe" 2>nul

echo.
echo Starting new frontend...
start "Frontend Server" cmd /k "cd frontend && set BROWSER=none && npm start"

echo Frontend restarted!
echo Frontend URL: http://localhost:3000 