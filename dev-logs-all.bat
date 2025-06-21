@echo off
chcp 65001 >nul
echo ================================
echo   ALL LOGS VIEWER
echo ================================
echo.

set TODAY=%date:~-4%-%date:~3,2%-%date:~0,2%
set BACKEND_LOG=backend\logs\app-%TODAY%.log
set FRONTEND_LOG=backend\logs\frontend\frontend-%TODAY%.log

:MENU
echo ================================
echo   LOG VIEWING OPTIONS
echo ================================
echo 1. Backend logs (last 20 lines)
echo 2. Frontend logs (last 20 lines)
echo 3. All logs combined (last 30 lines)
echo 4. Search in all logs
echo 5. View backend log file
echo 6. View frontend log file
echo 7. Clear all logs
echo 8. Real-time monitoring
echo 9. Exit
echo.

if exist "%BACKEND_LOG%" (
    echo Backend log: %BACKEND_LOG% [EXISTS]
) else (
    echo Backend log: %BACKEND_LOG% [NOT FOUND]
)

if exist "%FRONTEND_LOG%" (
    echo Frontend log: %FRONTEND_LOG% [EXISTS]
) else (
    echo Frontend log: %FRONTEND_LOG% [NOT FOUND]
)

echo.
set /p choice="Select option (1-9): "

if "%choice%"=="1" (
    echo.
    echo === BACKEND LOGS (Last 20 lines) ===
    if exist "%BACKEND_LOG%" (
        powershell "Get-Content '%BACKEND_LOG%' -Tail 20"
    ) else (
        echo Backend log file not found.
    )
    echo.
    pause
    goto MENU
)

if "%choice%"=="2" (
    echo.
    echo === FRONTEND LOGS (Last 20 lines) ===
    if exist "%FRONTEND_LOG%" (
        powershell "Get-Content '%FRONTEND_LOG%' -Tail 20"
    ) else (
        echo Frontend log file not found. Try opening the web UI and performing some actions.
    )
    echo.
    pause
    goto MENU
)

if "%choice%"=="3" (
    echo.
    echo === ALL LOGS COMBINED (Last 30 lines) ===
    (
        if exist "%BACKEND_LOG%" (
            powershell "Get-Content '%BACKEND_LOG%' -Tail 15 | ForEach-Object { '[BACKEND] ' + $_ }"
        )
        if exist "%FRONTEND_LOG%" (
            powershell "Get-Content '%FRONTEND_LOG%' -Tail 15 | ForEach-Object { '[FRONTEND] ' + $_ }"
        )
    ) | sort
    echo.
    pause
    goto MENU
)

if "%choice%"=="4" (
    echo.
    set /p search_term="Enter search term: "
    echo.
    echo === SEARCH RESULTS for "%search_term%" ===
    if exist "%BACKEND_LOG%" (
        echo [BACKEND RESULTS]:
        findstr /i "%search_term%" "%BACKEND_LOG%" 2>nul
    )
    if exist "%FRONTEND_LOG%" (
        echo.
        echo [FRONTEND RESULTS]:
        findstr /i "%search_term%" "%FRONTEND_LOG%" 2>nul
    )
    echo.
    pause
    goto MENU
)

if "%choice%"=="5" (
    if exist "%BACKEND_LOG%" (
        notepad "%BACKEND_LOG%"
    ) else (
        echo Backend log file not found.
        pause
    )
    goto MENU
)

if "%choice%"=="6" (
    if exist "%FRONTEND_LOG%" (
        notepad "%FRONTEND_LOG%"
    ) else (
        echo Frontend log file not found.
        pause
    )
    goto MENU
)

if "%choice%"=="7" (
    echo.
    set /p confirm="Are you sure you want to clear ALL logs? (y/N): "
    if /i "%confirm%"=="y" (
        if exist "%BACKEND_LOG%" echo. > "%BACKEND_LOG%"
        if exist "%FRONTEND_LOG%" echo. > "%FRONTEND_LOG%"
        echo All logs cleared.
    ) else (
        echo Operation cancelled.
    )
    echo.
    pause
    goto MENU
)

if "%choice%"=="8" (
    echo.
    echo === REAL-TIME LOG MONITORING (Ctrl+C to stop) ===
    echo Monitoring both backend and frontend logs...
    echo.
    
    if exist "%BACKEND_LOG%" (
        start "Backend Logs" powershell "Get-Content '%BACKEND_LOG%' -Wait -Tail 10 | ForEach-Object { '[BACKEND] ' + $_ }"
    )
    if exist "%FRONTEND_LOG%" (
        start "Frontend Logs" powershell "Get-Content '%FRONTEND_LOG%' -Wait -Tail 10 | ForEach-Object { '[FRONTEND] ' + $_ }"
    )
    
    echo Monitoring windows opened. Close them manually when done.
    pause
    goto MENU
)

if "%choice%"=="9" (
    exit /b 0
)

echo Invalid choice. Please select 1-9.
echo.
pause
goto MENU 