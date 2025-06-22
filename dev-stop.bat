@echo off
chcp 65001 >nul
echo ================================
echo   STOPPING PROJECT MASTER
echo ================================
echo.

echo [1/4] Stopping backend processes (Go)...
tasklist | findstr /i "go.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo ^> Found Go processes, stopping...
    taskkill /f /im go.exe >nul 2>&1
    echo ^> Go processes stopped
) else (
    echo ^> No Go processes found
)

echo.
echo [2/4] Stopping frontend processes (Node.js/npm)...
wmic process where "name='node.exe' and commandline like '%%npm start%%'" get processid /value >nul 2>&1
if %errorlevel% equ 0 (
    echo ^> Found npm start processes, stopping...
    for /f "skip=1 tokens=1 delims==" %%i in ('wmic process where "name='node.exe' and commandline like '%%npm start%%'" get processid /value') do (
        taskkill /f /pid %%i >nul 2>&1
    )
    echo ^> npm start processes stopped
) else (
    echo ^> No npm start processes found
)

echo.
echo [3/4] Stopping ports 3000, 3001, 8080...
:: Убиваем процессы на портах
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo ^> Ports freed

echo.
echo [4/4] Stopping Docker containers...
docker-compose stop
if %errorlevel% equ 0 (
    echo ^> Docker containers stopped
) else (
    echo ^> No Docker containers to stop or error occurred
)

echo.
echo ================================
echo   ALL SERVICES STOPPED
echo ================================
echo.
echo You can now run 'dev-start.bat' to start services again.
echo ================================ 
echo ================================ 