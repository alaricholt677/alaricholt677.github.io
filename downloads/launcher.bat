@echo off
setlocal enabledelayedexpansion
title IRL Simulator - Identity Launcher

:: 1. Core Configuration
set "JAR_NAME=IRLSimulator.jar"
set "SKIN_FOLDER=assets\skins"

:start
cls
echo ========================================
echo        IRL SIMULATOR PRO LAUNCHER
echo ========================================
echo.

:: 2. Identity Input
set /p "user_input=Enter Player Name: "

if "%user_input%"=="" (
    echo [!] Name cannot be empty.
    timeout /t 2 >nul
    goto start
)

:: 3. "Cool Skin" Generation Logic
:: If the skin folder doesn't exist, create it.
if not exist "%SKIN_FOLDER%" mkdir "%SKIN_FOLDER%"

:: If the player doesn't have a skin file, we create a 'Cool' dummy file
:: so the GameLoader doesn't throw a NullPointerException.
if not exist "%SKIN_FOLDER%\%user_input%.png" (
    echo [SYSTEM] Generating 'Cool' aesthetic skin for %user_input%...
    echo. > "%SKIN_FOLDER%\%user_input%.png"
)

:: 4. Launch with Internal JAR Pathing
echo Launching %JAR_NAME%...
echo ----------------------------------------
echo NAME:      %user_input%
echo CLASSES:   Inside %JAR_NAME%
echo SKIN:      %SKIN_FOLDER%\%user_input%.png
echo ----------------------------------------
echo.

:: We pass "." as PathToClasses so the ClassLoader looks inside the current Classpath (the JAR).
java -Xmx2G -cp "%JAR_NAME%" main.Main --PathToClasses "." --Name "%user_input%" --skinDir "%SKIN_FOLDER%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Game crashed. Check if %JAR_NAME% exists in this folder.
    pause
)

exit