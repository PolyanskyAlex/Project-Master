@echo off
echo ================================
echo   PROJECT MASTER EXTENSION 
echo      REINSTALL SCRIPT
echo ================================
echo.

echo [1/5] Removing old extension...
code --uninstall-extension project-master.project-master-extension
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Extension may not have been installed previously
) else (
    echo ✓ Old extension removed successfully
)

echo.
echo [2/5] Waiting for VS Code to process...
timeout /t 3 >nul

echo.
echo [3/5] Installing new extension with bugfix...
code --install-extension project-master-extension-0.4.5.vsix
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install extension
    pause
    exit /b 1
) else (
    echo ✓ Extension installed successfully
)

echo.
echo [4/5] Waiting for installation to complete...
timeout /t 2 >nul

echo.
echo [5/5] Reloading VS Code window...
echo Please reload your VS Code window (Ctrl+Shift+P -> Developer: Reload Window)
echo.

echo ================================
echo   EXTENSION REINSTALLED!
echo   B016_EXT BUGFIX APPLIED ✅
echo ================================
echo.
echo IMPORTANT: 
echo 1. Close and reopen VS Code completely
echo 2. Or use Ctrl+Shift+P -> Developer: Reload Window
echo 3. Try selecting a project again
echo.
pause 