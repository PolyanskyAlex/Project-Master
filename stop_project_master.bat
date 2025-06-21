@echo off
chcp 65001 >nul
echo ================================
echo   PROJECT MASTER SHUTDOWN
echo ================================
echo.

echo Stopping all services...
docker-compose down

if %errorlevel% neq 0 (
    echo ERROR: Failed to stop containers
    pause
    exit /b 1
)

echo.
echo ^> All services stopped
echo ^> Containers removed
echo ^> Network cleaned up
echo.
echo Project Master system has been stopped.
echo.
pause 