@echo off
chcp 65001 >nul
echo ================================
echo   RESTARTING FRONTEND SERVER
echo ================================
echo.

echo [1/2] Stopping current frontend...
tasklist | findstr /i "node.exe" >nul 2>&1
if %errorlevel% equ 0 (
    taskkill /f /im node.exe >nul 2>&1
    echo ^> Frontend stopped
) else (
    echo ^> Frontend was not running
)

echo.
echo [2/2] Starting new frontend...
cd frontend
set BROWSER=none
echo ^> Starting React server in background...
start /b npm start
cd ..

echo.
echo ================================
echo   FRONTEND RESTARTED
echo ================================
echo ^> Frontend URL: http://localhost:3000 