@echo off
title Open Robotics Virtual Lab (Production Mode)
color 0a
cls
echo ===================================================================
echo        OPEN ROBOTICS VIRTUAL LAB - PRODUCTION PREVIEW
echo ===================================================================
echo.
echo  [+] Launching pre-compiled optimized production build...
echo  [+] Opening browser at: http://localhost:4173
echo.
echo  Keep this terminal window open while using the laboratory.
echo  Press Ctrl+C to shut down the server when finished.
echo ===================================================================
echo.

:: Open default browser after 2 seconds
start "" powershell -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:4173'"

:: Run Vite Preview
call npm run preview

pause
