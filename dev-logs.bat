@echo off
chcp 65001 >nul
echo ================================
echo   PROJECT MASTER - LOGS VIEWER
echo ================================
echo.

set LOG_FILE=backend\logs\app-%date:~-4%-%date:~3,2%-%date:~0,2%.log

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
echo Press Ctrl+C to stop
echo.

:MENU
echo ================================
echo   LOG VIEWING OPTIONS
echo ================================
echo 1. View last 20 lines
echo 2. View last 50 lines  
echo 3. Follow logs (real-time)
echo 4. Search in logs
echo 5. View all logs
echo 6. Clear logs
echo 7. Exit
echo.
set /p choice="Select option (1-7): "

if "%choice%"=="1" (
    echo.
    echo === LAST 20 LINES ===
    tail -n 20 "%LOG_FILE%" | jq -r '. | "[" + .timestamp[11:19] + "] " + .level + " " + .message + (if .data then " | " + (.data | tostring) else "" end)'
    echo.
    pause
    goto MENU
)

if "%choice%"=="2" (
    echo.
    echo === LAST 50 LINES ===
    tail -n 50 "%LOG_FILE%" | jq -r '. | "[" + .timestamp[11:19] + "] " + .level + " " + .message + (if .data then " | " + (.data | tostring) else "" end)'
    echo.
    pause
    goto MENU
)

if "%choice%"=="3" (
    echo.
    echo === FOLLOWING LOGS (Ctrl+C to stop) ===
    tail -f "%LOG_FILE%" | jq -r '. | "[" + .timestamp[11:19] + "] " + .level + " " + .message + (if .data then " | " + (.data | tostring) else "" end)'
    goto MENU
)

if "%choice%"=="4" (
    echo.
    set /p search_term="Enter search term: "
    echo.
    echo === SEARCH RESULTS for "%search_term%" ===
    findstr /i "%search_term%" "%LOG_FILE%" | jq -r '. | "[" + .timestamp[11:19] + "] " + .level + " " + .message + (if .data then " | " + (.data | tostring) else "" end)'
    echo.
    pause
    goto MENU
)

if "%choice%"=="5" (
    echo.
    echo === ALL LOGS ===
    type "%LOG_FILE%" | jq -r '. | "[" + .timestamp[11:19] + "] " + .level + " " + .message + (if .data then " | " + (.data | tostring) else "" end)'
    echo.
    pause
    goto MENU
)

if "%choice%"=="6" (
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

if "%choice%"=="7" (
    exit /b 0
)

echo Invalid choice. Please select 1-7.
echo.
pause
goto MENU 