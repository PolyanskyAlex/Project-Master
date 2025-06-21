@echo off
chcp 65001 >nul
echo ================================
echo   PROJECT MASTER - LOGS VIEWER
echo ================================
echo.

set TODAY=%date:~-4%-%date:~3,2%-%date:~0,2%
set LOG_FILE=backend\logs\app-%TODAY%.log

if not exist "%LOG_FILE%" (
    echo Log file not found: %LOG_FILE%
    echo.
    echo Available log files:
    dir /b backend\logs\*.log 2>nul
    echo.
    pause
    exit /b 1
)

echo Viewing logs: %LOG_FILE%
echo.

:MENU
echo ================================
echo   LOG VIEWING OPTIONS
echo ================================
echo 1. View last 10 lines
echo 2. View last 20 lines  
echo 3. View all logs
echo 4. Search in logs
echo 5. Clear logs
echo 6. Open log file in notepad
echo 7. Exit
echo.
set /p choice="Select option (1-7): "

if "%choice%"=="1" (
    echo.
    echo === LAST 10 LINES ===
    powershell "Get-Content '%LOG_FILE%' -Tail 10"
    echo.
    pause
    goto MENU
)

if "%choice%"=="2" (
    echo.
    echo === LAST 20 LINES ===
    powershell "Get-Content '%LOG_FILE%' -Tail 20"
    echo.
    pause
    goto MENU
)

if "%choice%"=="3" (
    echo.
    echo === ALL LOGS ===
    type "%LOG_FILE%"
    echo.
    pause
    goto MENU
)

if "%choice%"=="4" (
    echo.
    set /p search_term="Enter search term: "
    echo.
    echo === SEARCH RESULTS for "%search_term%" ===
    findstr /i "%search_term%" "%LOG_FILE%"
    echo.
    pause
    goto MENU
)

if "%choice%"=="5" (
    echo.
    set /p confirm="Are you sure you want to clear logs? (y/N): "
    if /i "%confirm%"=="y" (
        echo. > "%LOG_FILE%"
        echo Logs cleared.
    ) else (
        echo Operation cancelled.
    )
    echo.
    pause
    goto MENU
)

if "%choice%"=="6" (
    notepad "%LOG_FILE%"
    goto MENU
)

if "%choice%"=="7" (
    exit /b 0
)

echo Invalid choice. Please select 1-7.
echo.
pause
goto MENU 