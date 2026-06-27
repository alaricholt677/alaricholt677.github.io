@echo off
setlocal ENABLEDELAYEDEXPANSION

rem ==================================================
rem emu.bat
rem Emulator package manager + .emuarg compiler
rem
rem Commands:
rem   emu install --setupfolder
rem   emu install <pkg>
rem   emu uninstall <pkg>
rem   emu update self
rem   emu update <pkg>
rem   emu doesexist <pkg>
rem   emu about <pkg>
rem   emu all pkgs
rem   emu compile <file.emulator> [--AllPackage] [--AllPackages] [--include:pkg1,pkg2]
rem
rem .emuarg format:
rem   JSON, no dashed BEGIN/END markers.
rem ==================================================

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
    if "%~2"=="" goto :usage
    goto :updatepkg
)

if /I "%~1"=="compile" (
    if "%~2"=="" goto :usage
    goto :compile
)

if /I "%~1"=="about" (
    if "%~2"=="" goto :usage
    goto :about
)

if /I "%~1"=="doesexist" (
    if "%~2"=="" goto :usage
    goto :doesexist
)

if /I "%~1"=="all" (
    if /I "%~2"=="pkgs" goto :allpkgs
)

goto :usage


:usage
echo.
echo Usage:
echo   emu install --setupfolder
echo   emu install ^<pkg^>
echo   emu uninstall ^<pkg^>
echo   emu update self
echo   emu update ^<pkg^>
echo   emu doesexist ^<pkg^>
echo   emu about ^<pkg^>
echo   emu all pkgs
echo   emu compile ^<file.emulator^> [--AllPackage] [--include:pkg1,pkg2]
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
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { Invoke-WebRequest -Uri 'https://github.com' -UseBasicParsing -TimeoutSec 5 | Out-Null; exit 0 } catch { exit 1 }"

if errorlevel 1 (
    echo [EMU] No network connection detected.
    echo [EMU] Opening Wi-Fi settings...
    start ms-settings:network-wifi
    echo [EMU] Please connect to a network and retry.
    exit /b 1
)

goto :eof


:allpkgs
call :check_folder
call :check_online

echo [EMU] Listing packages from:
echo [EMU] %PKG_INDEX_URL%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$idx=Invoke-RestMethod -Uri '%PKG_INDEX_URL%' -UseBasicParsing;" ^
  "foreach($p in $idx.pkgs){" ^
  "  Write-Host '============================================================';" ^
  "  Write-Host ('Package:      ' + $p.name);" ^
  "  Write-Host ('Version:      ' + $p.version);" ^
  "  Write-Host ('Install:      emu install ' + $p.name);" ^
  "  Write-Host ('URL:          ' + $p.url);" ^
  "  if($p.dependencies -and $p.dependencies.Count -gt 0){ Write-Host ('Dependencies: ' + (($p.dependencies) -join ', ')) } else { Write-Host 'Dependencies: none' };" ^
  "  Write-Host '';" ^
  "  Write-Host 'Description:';" ^
  "  if($p.description){ Write-Host $p.description } else { Write-Host 'No description provided.' };" ^
  "  Write-Host '';" ^
  "}" ^
  "Write-Host '============================================================';"

exit /b %ERRORLEVEL%


:about
call :check_folder
call :check_online

set "PKG_NAME=%~2"
set "PKG_DIR=%EMU_BASE%\%PKG_NAME%"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$name='%PKG_NAME%';" ^
  "$idx=Invoke-RestMethod -Uri '%PKG_INDEX_URL%' -UseBasicParsing;" ^
  "$p=$idx.pkgs | Where-Object { $_.name -ieq $name } | Select-Object -First 1;" ^
  "if(-not $p){ Write-Host ('[EMU] Package not found in index: ' + $name); exit 1 };" ^
  "Write-Host '============================================================';" ^
  "Write-Host ('Package:      ' + $p.name);" ^
  "Write-Host ('Version:      ' + $p.version);" ^
  "Write-Host ('Install:      emu install ' + $p.name);" ^
  "Write-Host ('URL:          ' + $p.url);" ^
  "if($p.dependencies -and $p.dependencies.Count -gt 0){ Write-Host ('Dependencies: ' + (($p.dependencies) -join ', ')) } else { Write-Host 'Dependencies: none' };" ^
  "Write-Host '';" ^
  "Write-Host 'Description:';" ^
  "if($p.description){ Write-Host $p.description } else { Write-Host 'No description provided.' };" ^
  "Write-Host '============================================================';"

echo.
if exist "%PKG_DIR%" (
    echo [EMU] Local status: installed at "%PKG_DIR%"
    echo [EMU] Top-level files:
    dir /b "%PKG_DIR%" 2>nul
) else (
    echo [EMU] Local status: not installed
)

exit /b %ERRORLEVEL%


:doesexist
call :check_folder

set "PKG_NAME=%~2"
set "PKG_DIR=%EMU_BASE%\%PKG_NAME%"

if exist "%PKG_DIR%" (
    echo YES
    exit /b 0
) else (
    echo NO
    exit /b 1
)


:install
call :check_folder
call :check_online

set "PKG_NAME=%~2"

echo [EMU] Installing "%PKG_NAME%" and dependencies...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$IndexUrl='%PKG_INDEX_URL%';" ^
  "$Base='%EMU_BASE%';" ^
  "$RootName='%PKG_NAME%';" ^
  "function W($m){ Write-Host ('[EMU] ' + $m) }" ^
  "function GetPkg($idx,$name){ return $idx.pkgs | Where-Object { $_.name -ieq $name } | Select-Object -First 1 }" ^
  "function NormalizePkg($name,$extract,$dest){" ^
  "  if(Test-Path -LiteralPath $dest){ Remove-Item -LiteralPath $dest -Recurse -Force };" ^
  "  New-Item -ItemType Directory -Force -Path $dest | Out-Null;" ^
  "  $case1=Join-Path $extract (Join-Path $name (Join-Path $name '__init__.py'));" ^
  "  $case2=Join-Path $extract (Join-Path $name '__init__.py');" ^
  "  $case3=Join-Path $extract '__init__.py';" ^
  "  if(Test-Path -LiteralPath $case1){" ^
  "    Copy-Item -Path (Join-Path $extract (Join-Path $name '*')) -Destination $dest -Recurse -Force;" ^
  "  } elseif(Test-Path -LiteralPath $case2){" ^
  "    $inner=Join-Path $dest $name;" ^
  "    New-Item -ItemType Directory -Force -Path $inner | Out-Null;" ^
  "    Copy-Item -Path (Join-Path (Join-Path $extract $name) '*') -Destination $inner -Recurse -Force;" ^
  "  } elseif(Test-Path -LiteralPath $case3){" ^
  "    $inner=Join-Path $dest $name;" ^
  "    New-Item -ItemType Directory -Force -Path $inner | Out-Null;" ^
  "    Copy-Item -Path (Join-Path $extract '*') -Destination $inner -Recurse -Force;" ^
  "  } else {" ^
  "    Copy-Item -Path (Join-Path $extract '*') -Destination $dest -Recurse -Force;" ^
  "  };" ^
  "  $expected=Join-Path $dest (Join-Path $name '__init__.py');" ^
  "  if(Test-Path -LiteralPath $expected){ W ('Verified loader path: ' + $expected) } else { W ('WARNING: Expected loader path not found: ' + $expected) };" ^
  "}" ^
  "function InstallRec($idx,$name,$stack){" ^
  "  $lower=$name.ToLower();" ^
  "  if($stack -contains $lower){ throw ('Dependency loop detected: ' + (($stack + $lower) -join ' -> ')) };" ^
  "  $pkg=GetPkg $idx $name;" ^
  "  if(-not $pkg){ throw ('Package not found in index: ' + $name) };" ^
  "  $real=[string]$pkg.name;" ^
  "  $dest=Join-Path $Base $real;" ^
  "  if(Test-Path -LiteralPath $dest){ W ($real + ' already installed.'); return };" ^
  "  if($pkg.dependencies){" ^
  "    foreach($dep in $pkg.dependencies){" ^
  "      if($dep){ W ('Installing dependency for ' + $real + ': ' + $dep); InstallRec $idx ([string]$dep) ($stack + $lower) }" ^
  "    }" ^
  "  };" ^
  "  $url=[string]$pkg.url;" ^
  "  if(-not $url){ throw ('Package URL missing for: ' + $real) };" ^
  "  $tmpZip=Join-Path $env:TEMP ($real + '_emu_pkg.zip');" ^
  "  $tmpExtract=Join-Path $env:TEMP ($real + '_emu_extract_' + [guid]::NewGuid().ToString());" ^
  "  Remove-Item -LiteralPath $tmpZip -Force -ErrorAction SilentlyContinue;" ^
  "  Remove-Item -LiteralPath $tmpExtract -Recurse -Force -ErrorAction SilentlyContinue;" ^
  "  New-Item -ItemType Directory -Force -Path $tmpExtract | Out-Null;" ^
  "  W ('Downloading ' + $real + ' from ' + $url);" ^
  "  Invoke-WebRequest -Uri $url -OutFile $tmpZip -UseBasicParsing;" ^
  "  W ('Extracting ' + $real);" ^
  "  Expand-Archive -LiteralPath $tmpZip -DestinationPath $tmpExtract -Force;" ^
  "  W ('Installing ' + $real + ' -> ' + $dest);" ^
  "  NormalizePkg $real $tmpExtract $dest;" ^
  "  Remove-Item -LiteralPath $tmpZip -Force -ErrorAction SilentlyContinue;" ^
  "  Remove-Item -LiteralPath $tmpExtract -Recurse -Force -ErrorAction SilentlyContinue;" ^
  "  W ('Installed ' + $real);" ^
  "}" ^
  "try{" ^
  "  if(-not (Test-Path -LiteralPath $Base)){ New-Item -ItemType Directory -Force -Path $Base | Out-Null };" ^
  "  W ('Reading package index: ' + $IndexUrl);" ^
  "  $idx=Invoke-RestMethod -Uri $IndexUrl -UseBasicParsing;" ^
  "  InstallRec $idx $RootName @();" ^
  "  W 'Install complete.';" ^
  "} catch { Write-Host ('[EMU] ERROR: ' + $_.Exception.Message); exit 1 }"

exit /b %ERRORLEVEL%


:uninstall
call :check_folder

set "PKG_NAME=%~2"
set "PKG_DIR=%EMU_BASE%\%PKG_NAME%"

if not exist "%PKG_DIR%" (
    echo [EMU] Package "%PKG_NAME%" is not installed.
    exit /b 0
)

echo [EMU] Uninstalling "%PKG_NAME%"...
rmdir /s /q "%PKG_DIR%"

if errorlevel 1 (
    echo [EMU] ERROR: Failed to remove "%PKG_DIR%".
    exit /b 1
)

echo [EMU] Uninstalled "%PKG_NAME%".
exit /b 0


:updatepkg
call :check_folder
call :check_online

set "PKG_NAME=%~2"
set "PKG_DIR=%EMU_BASE%\%PKG_NAME%"

echo [EMU] Updating "%PKG_NAME%"...
echo [EMU] This will reinstall the package and dependencies.

if exist "%PKG_DIR%" (
    rmdir /s /q "%PKG_DIR%" >nul 2>&1
)

call :install install "%PKG_NAME%"
exit /b %ERRORLEVEL%


:updateself
call :check_online

set "SELF_DIR=%~dp0"
set "SELF_CUR=%SELF_DIR%emu.bat"
set "SELF_NEW=%SELF_DIR%emu_new.bat"
set "SELF_OLD=%SELF_DIR%emu_old.bat"

echo [EMU] Downloading new emu.bat...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Invoke-WebRequest -Uri '%SELF_URL%' -OutFile '%SELF_NEW%' -UseBasicParsing"

if errorlevel 1 (
    echo [EMU] ERROR: Failed to download new emu.bat.
    exit /b 1
)

echo [EMU] Backing up old version as emu_old.bat
copy /y "%SELF_CUR%" "%SELF_OLD%" >nul

echo [EMU] Scheduling self-update...
(
    echo @echo off
    echo timeout /t 2 ^>nul
    echo copy /y "%SELF_NEW%" "%SELF_CUR%" ^>nul
    echo del /f /q "%SELF_NEW%" ^>nul
    echo del /f /q "%%~f0" ^>nul
) > "%SELF_DIR%emu_update_tmp.bat"

start "" "%SELF_DIR%emu_update_tmp.bat"

echo [EMU] Self-update initiated.
exit /b 0


:compile
call :check_folder

shift

set "EMU_FILE="

:collect_loop
if "%~1"=="" goto :no_file

set "tok=%~1"
call set "tok2=%%tok:~0,2%%"

if "%tok2%"=="--" goto :flags_start

if defined EMU_FILE (
    set "EMU_FILE=!EMU_FILE! %~1"
) else (
    set "EMU_FILE=%~1"
)

shift
goto :collect_loop


:flags_start
if not defined EMU_FILE goto :no_file

call set "EMU_FILE=%%EMU_FILE:/=\%%"

set "INCLUDE_ALL=0"
set "INCLUDE_LIST="

:flag_loop
if "%~1"=="" goto :compile_start

set "f=%~1"

if /I "%f%"=="--AllPackage" set "INCLUDE_ALL=1"
if /I "%f%"=="--AllPackages" set "INCLUDE_ALL=1"

call set "pref=%%f:~0,10%%"
if /I "%pref%"=="--include:" (
    call set "INCLUDE_LIST=%%f:~10%%"
)

shift
goto :flag_loop


:compile_start
echo [EMU] DEBUG: Parsed EMU_FILE="%EMU_FILE%"
echo [EMU] DEBUG: INCLUDE_ALL=%INCLUDE_ALL% INCLUDE_LIST=%INCLUDE_LIST%

if not exist "%EMU_FILE%" (
    echo [EMU] ERROR: Emulator file "%EMU_FILE%" not found.
    exit /b 1
)

set "OUT_DIR=%CD%\EMUPUT"
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

for %%F in ("%EMU_FILE%") do set "OUT_NAME=%%~nF"
set "OUT_FILE=%OUT_DIR%\%OUT_NAME%.emuarg"

echo [EMU] Compiling "%EMU_FILE%"...
echo [EMU] Output format: JSON .emuarg, no dashed BEGIN/END markers.

set "TMP_DEP="
set "TMP_DEP_DIR="

if "%INCLUDE_ALL%"=="1" goto :compile_all_deps
if defined INCLUDE_LIST goto :compile_specific_deps
goto :write_emuarg


:compile_all_deps
echo [EMU] Including ALL packages...

set "TMP_DEP=%TEMP%\emu_deps_%RANDOM%_%RANDOM%.zip"

del /f /q "%TMP_DEP%" >nul 2>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "if(Test-Path -LiteralPath '%EMU_BASE%'){ Compress-Archive -Path '%EMU_BASE%\*' -DestinationPath '%TMP_DEP%' -Force } else { exit 2 }"

if errorlevel 1 (
    echo [EMU] ERROR: Failed to package dependencies.
    exit /b 1
)

goto :write_emuarg


:compile_specific_deps
echo [EMU] Including specific packages...

set "TMP_DEP=%TEMP%\emu_deps_%RANDOM%_%RANDOM%.zip"
set "TMP_DEP_DIR=%TEMP%\emu_dep_tmp_%RANDOM%_%RANDOM%"

del /f /q "%TMP_DEP%" >nul 2>&1
rmdir /s /q "%TMP_DEP_DIR%" >nul 2>&1
mkdir "%TMP_DEP_DIR%" >nul 2>&1

set "PKGS=%INCLUDE_LIST:,= %"

for %%P in (%PKGS%) do (
    if exist "%EMU_BASE%\%%P" (
        xcopy "%EMU_BASE%\%%P" "%TMP_DEP_DIR%\%%P\" /E /I /Y >nul
    ) else (
        echo [EMU] WARNING: Package "%%P" not installed.
    )
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "if(Test-Path -LiteralPath '%TMP_DEP_DIR%'){ Compress-Archive -Path '%TMP_DEP_DIR%\*' -DestinationPath '%TMP_DEP%' -Force } else { exit 2 }"

if errorlevel 1 (
    echo [EMU] ERROR: Failed to package dependencies.
    exit /b 1
)

goto :write_emuarg


:write_emuarg
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$in='%EMU_FILE%';" ^
  "$out='%OUT_FILE%';" ^
  "$dep='%TMP_DEP%';" ^
  "if(-not (Test-Path -LiteralPath $in)){ Write-Host '[EMU] ERROR: Input missing.'; exit 2 };" ^
  "$emuBytes=[IO.File]::ReadAllBytes($in);" ^
  "$emuB64=[Convert]::ToBase64String($emuBytes);" ^
  "$depB64=$null;" ^
  "if($dep -and (Test-Path -LiteralPath $dep)){" ^
  "  $depBytes=[IO.File]::ReadAllBytes($dep);" ^
  "  $depB64=[Convert]::ToBase64String($depBytes);" ^
  "}" ^
  "$obj=[ordered]@{" ^
  "  format='emuarg';" ^
  "  version='2';" ^
  "  emulator=$emuB64;" ^
  "  dependencies=$depB64;" ^
  "};" ^
  "$json=$obj | ConvertTo-Json -Depth 8;" ^
  "[IO.File]::WriteAllText($out,$json,[Text.Encoding]::UTF8);"

if errorlevel 1 (
    echo [EMU] ERROR: Failed to write .emuarg.
    exit /b 1
)

if defined TMP_DEP del /f /q "%TMP_DEP%" >nul 2>&1
if defined TMP_DEP_DIR rmdir /s /q "%TMP_DEP_DIR%" >nul 2>&1

echo [EMU] Compile complete: "%OUT_FILE%"
exit /b 0


:no_file
echo [EMU] ERROR: No emulator file specified.
exit /b 1
