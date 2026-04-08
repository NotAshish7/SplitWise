@echo off
echo.
echo ========================================
echo   RESTARTING FRONTEND SERVER
echo ========================================
echo.
cd frontend
echo Starting frontend server...
echo Frontend will run on: http://localhost:5500
echo.
npx http-server -p 5500 -c-1

