@echo off
title Open Robotics Virtual Lab
color 0b
cls
echo ===================================================================
echo               OPEN ROBOTICS VIRTUAL LAB - LAUNCHER
echo ===================================================================
echo.
echo  [+] Launching 3D Robotics Simulator & IDE...
echo  [+] Opening browser at: http://localhost:5173
echo.
echo  Keep this terminal window open while using the laboratory.
echo  Press Ctrl+C to shut down the server when finished.
echo ===================================================================
echo.

:: Open default browser after 2 seconds
start "" powershell -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:5173'"

:: Run Vite Dev Server
call npm run dev

pause
