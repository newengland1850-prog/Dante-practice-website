@echo off
rem Starts the Stacks site with its local news server, then opens it in your browser.
rem Needs Node.js (https://nodejs.org). Close this window to stop the server.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get it from https://nodejs.org and try again.
  pause
  exit /b 1
)
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8080/"
node server.js
pause
