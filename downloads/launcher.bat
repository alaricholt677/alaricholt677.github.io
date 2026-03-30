@echo off
setlocal

REM =========================================
REM IRL Simulator Launcher (Strict Args)
REM =========================================

cd /d "%~dp0"

REM Ensure required directories exist
if not exist "skins" (
    mkdir skins
)

if not exist "classes" (
    mkdir classes
)

REM Ensure at least one skin exists
if not exist "skins\default.png" (
    echo Missing skin: skins\default.png
    echo Please add a skin image before launching.
    pause
    exit /b
)

REM Launch with REQUIRED arguments
java -jar IRLSimulator.jar ^
 --PathToClasses "classes" ^
 --Name "Player" ^
 --skinDir "skins"

pause
