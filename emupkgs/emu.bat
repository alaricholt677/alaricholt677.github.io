@echo off
setlocal ENABLEDELAYEDEXPANSION

set "EMU_BASE=%LOCALAPPDATA%\EmulatorPackages"
set "PKG_INDEX_URL=https://alaricholt677.github.io/emupkgs/pkgs.json"
set "SELF_URL=https://alaricholt677.github.io/emupkgs/emu.bat"

if "%~1"=="" goto :usage

if /I "%~1"=="install" (
    if /I "%~2"=="--setupfolder" goto :setupfolder
    if "%~2"=="" goto :usage
    goto :install
)

if /I "%~1"=="uninstall" (
    if "%~2"=="" goto :usage
    goto :uninstall
)

if /I "%~1"=="update" (
    if /I "%~2"=="self" goto :updateself
)

goto :usage

:usage
echo.
echo Usage:
echo   emu install --setupfolder
echo   emu install ^<pkg^>
echo   emu uninstall ^<pkg^>
echo   emu update self
echo.
exit /b 1

:setupfolder
if exist "%EMU_BASE%" (
    echo [EMU] Folder already exists: "%EMU_BASE%"
    exit /b 0
)
mkdir "%EMU_BASE%" 2>nul
if errorlevel 1 (
    echo [EMU] ERROR: Failed to create "%EMU_BASE%".
    exit /b 1
)
echo [EMU] Created package root: "%EMU_BASE%"
exit /b 0

:check_folder
if not exist "%EMU_BASE%" (
    echo [EMU] ERROR: "%EMU_BASE%" does not exist.
    echo [EMU] Run: emu install --setupfolder
    exit /b 1
)
goto :eof

:check_online
ping -n 1 github.com >nul 2>&1
if errorlevel 1 (
    echo [EMU] No network connection detected.
    echo [EMU] Opening Wi-Fi settings...
    start ms-settings:network-wifi
    echo [EMU] Please connect to a network and retry this install/update.
    exit /b 1
)
goto :eof

:install
call :check_folder
call :check_online

set "PKG_NAME=%~2"
set "PKG_DIR=%EMU_BASE%\%PKG_NAME%"

if exist "%PKG_DIR%" (
    echo [EMU] %PKG_NAME% already exists in "%PKG_DIR%"
    exit /b 0
)

echo [EMU] Resolving package "%PKG_NAME%" from index...
set "PKG_URL="

for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command ^
  "$j = Invoke-RestMethod '%PKG_INDEX_URL%';" ^
  "$p = $j.pkgs ^| Where-Object { $_.name -eq '%PKG_NAME%' };" ^
  "if ($p) { $p.url }"`) do (
    set "PKG_URL=%%I"
)

if not defined PKG_URL (
    echo [EMU] ERROR: Package "%PKG_NAME%" not found in index.
    exit /b 1
)

echo [EMU] Package URL: %PKG_URL%

set "TMP_ZIP=%TEMP%\%PKG_NAME%_emu_pkg.zip"
del /f /q "%TMP_ZIP%" >nul 2>&1

echo [EMU] Downloading package...
powershell -NoProfile -Command "Invoke-WebRequest -Uri '%PKG_URL%' -OutFile '%TMP_ZIP%'" || (
    echo [EMU] ERROR: Failed to download package.
    exit /b 1
)

echo [EMU] Extracting package...
mkdir "%PKG_DIR%" 2>nul
powershell -NoProfile -Command "Expand-Archive -LiteralPath '%TMP_ZIP%' -DestinationPath '%PKG_DIR%' -Force" || (
    echo [EMU] ERROR: Failed to extract package.
    exit /b 1
)

echo [EMU] Installed %PKG_NAME% to "%PKG_DIR%"
exit /b 0

:uninstall
call :check_folder

set "PKG_NAME=%~2"
set "PKG_DIR=%EMU_BASE%\%PKG_NAME%"

if not exist "%PKG_DIR%" (
    echo [EMU] Package "%PKG_NAME%" is not installed.
    exit /b 0
)

echo [EMU] Uninstalling "%PKG_NAME%" from "%PKG_DIR%"...
rmdir /s /q "%PKG_DIR%"
if errorlevel 1 (
    echo [EMU] ERROR: Failed to remove "%PKG_DIR%".
    exit /b 1
)

echo [EMU] Uninstalled "%PKG_NAME%".
exit /b 0

:updateself
call :check_online

set "SELF_DIR=%~dp0"
set "SELF_OLD=%SELF_DIR%emu_old.bat"
set "SELF_NEW=%SELF_DIR%emu_new.bat"
set "SELF_CUR=%SELF_DIR%emu.bat"

echo [EMU] Downloading new emu.bat...
powershell -NoProfile -Command "Invoke-WebRequest -Uri '%SELF_URL%' -OutFile '%SELF_NEW%'" || (
    echo [EMU] ERROR: Failed to download new emu.bat.
    exit /b 1
)

echo [EMU] Keeping old version as emu_old.bat
copy /y "%SELF_CUR%" "%SELF_OLD%" >nul

echo [EMU] Scheduling self-update...
(
    echo @echo off
    echo timeout /t 2 ^>nul
    echo copy /y "%SELF_NEW%" "%SELF_CUR%" ^>nul
    echo del /f /q "%SELF_NEW%" ^>nul
) > "%SELF_DIR%emu_update_tmp.bat"

start "" "%SELF_DIR%emu_update_tmp.bat"

echo [EMU] Self-update initiated. New version will replace this emu.bat shortly.
exit /b 0
