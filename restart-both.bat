@echo off
echo.
echo ========================================
echo   STARTING BOTH SERVERS
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "Backend Server" cmd /k "cd /d "%~dp0backend" && echo. && echo ========================================  && echo    BACKEND SERVER && echo ======================================== && echo. && npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && echo. && echo ========================================  && echo    FRONTEND SERVER && echo ======================================== && echo. && npx http-server -p 5500 -c-1"

echo.
echo ========================================
echo   BOTH SERVERS STARTED
echo ========================================
echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5500
echo.
echo Open your browser and go to:
echo http://localhost:5500
echo.
echo To stop servers:
echo   - Press Ctrl+C in each CMD window
echo   - Type Y to confirm
echo.
echo Press any key to close this window...
pause >nul

