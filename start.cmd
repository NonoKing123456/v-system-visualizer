@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18+ was not found. Opening the offline version instead.
  start "" "%~dp0index.html"
  exit /b 0
)
node server.cjs --open
if errorlevel 1 pause
