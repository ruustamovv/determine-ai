@echo off
echo ====================================
echo   Determine-AI - Starting...
echo ====================================
echo.

:: Kill any existing processes on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

:: Start backend
echo [1/3] Starting backend on port 8000...
start "Determine-AI Backend" cmd /c "cd /d %~dp0 && python -m backend.main"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend dev server
echo [2/3] Starting frontend on port 5173...
start "Determine-AI Frontend" cmd /c "cd /d %~dp0\frontend && npm run dev"

:: Start admin dev server
echo [3/3] Starting admin on port 5174...
start "Determine-AI Admin" cmd /c "cd /d %~dp0\admin && npm run dev"

echo.
echo ====================================
echo   All services started!
echo ====================================
echo   Backend:    http://localhost:8000
echo   Frontend:   http://localhost:5173
echo   Admin:      http://localhost:5174
echo ====================================
echo.
echo Press any key to stop all services...
pause >nul

:: Kill all node processes (frontend + admin)
taskkill /F /IM node.exe >nul 2>&1
:: Kill Python backend
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo All services stopped.
