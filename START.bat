@echo off
title HAcktober - Starting Servers...
color 0A

echo ============================================
echo        HAcktober Project Launcher
echo ============================================
echo.

:: Start Backend Server
echo [1/2] Starting Backend Server (FastAPI)...
cd /d "%~dp0backend"
start "HAcktober Backend" cmd /k ".venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Small delay to let backend start first
timeout /t 3 /nobreak >nul

:: Start Frontend Server
echo [2/2] Starting Frontend Server (Vite)...
cd /d "%~dp0frontend"
start "HAcktober Frontend" cmd /k "npm run dev"

echo.
echo ============================================
echo   Both servers are starting!
echo.
echo   Backend  :  http://localhost:8000
echo   Frontend :  http://localhost:5173
echo   Health   :  http://localhost:8000/api/health
echo ============================================
echo.
echo You can close this window. The servers
echo are running in their own terminals.
echo.
pause
