@echo off
echo ========================================================
echo Compiling Simple Zombie Survival Simulator (OOP Console)
echo ========================================================

g++ -std=c++14 -Wall -Wextra main.cpp -o ZombieGame.exe

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Build completed successfully: ZombieGame.exe
    echo Run the console game by executing: ZombieGame.exe
) else (
    echo.
    echo [ERROR] Build failed! Check compiler output above.
)
pause
