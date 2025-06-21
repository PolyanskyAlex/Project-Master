@echo off
echo Открываю Project Master приложение...
start http://localhost:3000
timeout /t 2 >nul
start http://localhost:3001
timeout /t 2 >nul  
start http://localhost:3333
echo Приложение должно открыться в браузере!
pause 