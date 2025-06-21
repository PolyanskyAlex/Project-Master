@echo off
chcp 65001 >nul
echo ================================
echo   ALL LOGS VIEWER
echo ================================
echo.

set TODAY=%date:~-4%-%date:~3,2%-%date:~0,2%
set BACKEND_LOG=backend\logs\app-%TODAY%.log
set FRONTEND_LOG=backend\logs\frontend\frontend-%TODAY%.log
set EXTENSION_LOG=logs\vscode-extension\extension-%TODAY%.log

:MENU
echo ================================
echo   LOG VIEWING OPTIONS
echo ================================
echo 1. Backend logs (last 20 lines)
echo 2. Frontend logs (last 20 lines)
echo 3. VS Code Extension logs (last 20 lines)
echo 4. All logs combined (last 30 lines)
echo 5. Search in all logs
echo 6. View backend log file
echo 7. View frontend log file
echo 8. View extension log file
echo 9. Clear all logs
echo 10. Real-time monitoring
echo 11. Exit
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

if exist "%EXTENSION_LOG%" (
    echo Extension log: %EXTENSION_LOG% [EXISTS]
) else (
    echo Extension log: %EXTENSION_LOG% [NOT FOUND]
)

echo.
set /p choice="Select option (1-11): "

if "%choice%"=="1" goto BACKEND_TAIL
if "%choice%"=="2" goto FRONTEND_TAIL
if "%choice%"=="3" goto EXTENSION_TAIL
if "%choice%"=="4" goto ALL_COMBINED
if "%choice%"=="5" goto SEARCH_ALL
if "%choice%"=="6" goto VIEW_BACKEND
if "%choice%"=="7" goto VIEW_FRONTEND
if "%choice%"=="8" goto VIEW_EXTENSION
if "%choice%"=="9" goto CLEAR_LOGS
if "%choice%"=="10" goto REALTIME
if "%choice%"=="11" goto EXIT

echo Invalid choice. Please try again.
goto MENU

:BACKEND_TAIL
echo ================================
echo   BACKEND LOGS (Last 20 lines)
echo ================================
if exist "%BACKEND_LOG%" (
    powershell "Get-Content '%BACKEND_LOG%' -Tail 20"
) else (
    echo Backend log file not found.
)
echo.
pause
goto MENU

:FRONTEND_TAIL
echo ================================
echo   FRONTEND LOGS (Last 20 lines)
echo ================================
if exist "%FRONTEND_LOG%" (
    powershell "Get-Content '%FRONTEND_LOG%' -Tail 20"
) else (
    echo Frontend log file not found.
)
echo.
pause
goto MENU

:EXTENSION_TAIL
echo ================================
echo   EXTENSION LOGS (Last 20 lines)
echo ================================
if exist "%EXTENSION_LOG%" (
    powershell "Get-Content '%EXTENSION_LOG%' -Tail 20"
) else (
    echo Extension log file not found.
)
echo.
pause
goto MENU

:ALL_COMBINED
echo ================================
echo   ALL LOGS COMBINED (Last 30 lines)
echo ================================
(
if exist "%BACKEND_LOG%" (
    echo === BACKEND LOGS ===
    powershell "Get-Content '%BACKEND_LOG%' -Tail 10"
    echo.
)
if exist "%FRONTEND_LOG%" (
    echo === FRONTEND LOGS ===
    powershell "Get-Content '%FRONTEND_LOG%' -Tail 10"
    echo.
)
if exist "%EXTENSION_LOG%" (
    echo === EXTENSION LOGS ===
    powershell "Get-Content '%EXTENSION_LOG%' -Tail 10"
    echo.
)
)
pause
goto MENU

:SEARCH_ALL
set /p search_term="Enter search term: "
echo ================================
echo   SEARCHING ALL LOGS FOR: %search_term%
echo ================================
(
if exist "%BACKEND_LOG%" (
    echo === BACKEND RESULTS ===
    findstr /i "%search_term%" "%BACKEND_LOG%" 2>nul
    echo.
)
if exist "%FRONTEND_LOG%" (
    echo === FRONTEND RESULTS ===
    findstr /i "%search_term%" "%FRONTEND_LOG%" 2>nul
    echo.
)
if exist "%EXTENSION_LOG%" (
    echo === EXTENSION RESULTS ===
    findstr /i "%search_term%" "%EXTENSION_LOG%" 2>nul
    echo.
)
)
pause
goto MENU

:VIEW_BACKEND
if exist "%BACKEND_LOG%" (
    notepad "%BACKEND_LOG%"
) else (
    echo Backend log file not found.
    pause
)
goto MENU

:VIEW_FRONTEND
if exist "%FRONTEND_LOG%" (
    notepad "%FRONTEND_LOG%"
) else (
    echo Frontend log file not found.
    pause
)
goto MENU

:VIEW_EXTENSION
if exist "%EXTENSION_LOG%" (
    notepad "%EXTENSION_LOG%"
) else (
    echo Extension log file not found.
    pause
)
goto MENU

:CLEAR_LOGS
echo ================================
echo   CLEARING ALL LOGS
echo ================================
set /p confirm="Are you sure? (y/N): "
if /i "%confirm%"=="y" (
    if exist "%BACKEND_LOG%" del "%BACKEND_LOG%"
    if exist "%FRONTEND_LOG%" del "%FRONTEND_LOG%"
    if exist "%EXTENSION_LOG%" del "%EXTENSION_LOG%"
    echo All logs cleared.
) else (
    echo Operation cancelled.
)
pause
goto MENU

:REALTIME
echo ================================
echo   REAL-TIME LOG MONITORING
echo ================================
echo Press Ctrl+C to stop monitoring
echo.
if exist "%BACKEND_LOG%" (
    start "Backend Logs" powershell "Get-Content '%BACKEND_LOG%' -Wait -Tail 5"
)
if exist "%FRONTEND_LOG%" (
    start "Frontend Logs" powershell "Get-Content '%FRONTEND_LOG%' -Wait -Tail 5"
)
if exist "%EXTENSION_LOG%" (
    start "Extension Logs" powershell "Get-Content '%EXTENSION_LOG%' -Wait -Tail 5"
)
echo Monitoring started in separate windows.
pause
goto MENU

:EXIT
echo Goodbye!
exit /b 