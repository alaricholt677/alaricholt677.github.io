@echo off
setlocal ENABLEDELAYEDEXPANSION

rem ==================================================
rem Refactored emu.bat
rem - Robust argument parsing (quoted/unquoted)
rem - Safe substring operations via CALL
rem - Converts / -> \ only inside collected file path
rem - Flags: --AllPackage(s), --include:pkg1,pkg2,...
rem - Diagnostic output before compile
rem ==================================================

rem -------------------------
rem Configuration
rem -------------------------
set "EMU_BASE=%LOCALAPPDATA%\EmulatorPackages"
set "PKG_INDEX_URL=https://alaricholt677.github.io/emupkgs/pkgs.json"
set "SELF_URL=https://alaricholt677.github.io/emupkgs/emu.bat"

rem -------------------------
rem Dispatch
rem -------------------------
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

rem -------------------------

:about
call :check_folder

set "PKG_NAME=%~2"
set "PKG_DIR=%EMU_BASE%\%PKG_NAME%"

if exist "%PKG_DIR%" (
    echo [EMU] Package "%PKG_NAME%" is installed at "%PKG_DIR%"
    echo [EMU] Top-level files:
    dir /b "%PKG_DIR%" 2>nul
    echo [EMU] To list recursively: dir /s "%PKG_DIR%"
    exit /b 0
)

rem Not installed locally — try to resolve URL from index
set "PKG_NAME=%~2"
call :get_pkg_url
if not defined PKG_URL (
    echo [EMU] Package "%PKG_NAME%" not found in index.
    exit /b 1
)
echo [EMU] Package "%PKG_NAME%" is not installed locally.
echo [EMU] Index URL: %PKG_URL%
exit /b 0


rem -------------------------
:allpkgs
call :check_folder
echo [EMU] Listing packages from %PKG_INDEX_URL% ...
powershell -NoProfile -Command ^
  "try { (Invoke-RestMethod -Uri '%PKG_INDEX_URL%').pkgs | ForEach-Object { Write-Output (\"{0} {1} {2}\" -f $_.name,$_.version,$_.url) } } catch { Write-Host '[EMU] ERROR:' $_.Exception.Message; exit 1 }"
exit /b 0

endlocal
echo [EMU] All packages processed.
exit /b 0

rem -------------------------
:download_pkg
rem args: %1 = pkg name, %2 = url
setlocal
set "NAME=%~1"
set "URL=%~2"
set "DEST=%EMU_BASE%\%NAME%"
if not exist "%DEST%" mkdir "%DEST%" 2>nul

set "TMPZIP=%TEMP%\%NAME%.zip"
echo [EMU] Downloading %NAME% ...
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri '%URL%' -OutFile '%TMPZIP%' -UseBasicParsing } catch { Write-Host '[EMU] Download failed: ' $_.Exception.Message; exit 2 }"
if errorlevel 1 (
  endlocal
  exit /b 2
)

echo [EMU] Extracting %NAME% -> %DEST% ...
powershell -NoProfile -Command "try { Expand-Archive -LiteralPath '%TMPZIP%' -DestinationPath '%DEST%' -Force } catch { Write-Host '[EMU] Extract failed: ' $_.Exception.Message; exit 2 }"
if errorlevel 1 (
  del /f /q "%TMPZIP%" >nul 2>&1
  endlocal
  exit /b 2
)

del /f /q "%TMPZIP%" >nul 2>&1
echo [EMU] Installed %NAME% -> %DEST%
endlocal
exit /b 0

rem -------------------------
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
echo.
exit /b 1

rem -------------------------
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

rem -------------------------
:check_folder
if not exist "%EMU_BASE%" (
    echo [EMU] ERROR: "%EMU_BASE%" does not exist.
    echo [EMU] Run: emu install --setupfolder
    exit /b 1
)
goto :eof

rem -------------------------
:check_online
powershell -NoProfile -Command ^
  "try {Invoke-WebRequest 'https://github.com' -UseBasicParsing -TimeoutSec 5 | Out-Null; exit 0} catch {exit 1}"
if errorlevel 1 (
    echo [EMU] No network connection detected.
    echo [EMU] Opening Wi-Fi settings...
    start ms-settings:network-wifi
    echo [EMU] Please connect to a network and retry.
    exit /b 1
)
goto :eof

rem -------------------------
:get_pkg_url
set "PKG_URL="
for /f "usebackq tokens=* delims=" %%I in (`
    powershell -NoProfile -Command ^
      "$pkg = (Invoke-RestMethod '%PKG_INDEX_URL%').pkgs | Where-Object name -eq '%PKG_NAME%'; if ($pkg) { $pkg.url.Trim() }"
`) do (
    set "PKG_URL=%%I"
)
if not defined PKG_URL (
    echo [EMU] ERROR: Package "%PKG_NAME%" not found or URL missing.
    exit /b 1
)
goto :eof


rem -------------------------
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
call :get_pkg_url

echo [EMU] Package URL: %PKG_URL%

set "TMP_ZIP=%TEMP%\%PKG_NAME%_emu_pkg.zip"
del /f /q "%TMP_ZIP%" >nul 2>&1

echo [EMU] Downloading package...
powershell -NoProfile -Command ^
  "Invoke-WebRequest -Uri '%PKG_URL%' -OutFile '%TMP_ZIP%'" || (
    echo [EMU] ERROR: Failed to download package.
    exit /b 1
)

echo [EMU] Extracting package...
mkdir "%PKG_DIR%" 2>nul
powershell -NoProfile -Command ^
  "Expand-Archive -LiteralPath '%TMP_ZIP%' -DestinationPath '%PKG_DIR%' -Force" || (
    echo [EMU] ERROR: Failed to extract package.
    exit /b 1
)

echo [EMU] Installed %PKG_NAME% to "%PKG_DIR%"
exit /b 0

rem -------------------------
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

rem -------------------------
:updatepkg
call :check_folder
call :check_online

set "PKG_NAME=%~2"
set "PKG_DIR=%EMU_BASE%\%PKG_NAME%"

if not exist "%PKG_DIR%" (
    echo [EMU] Package "%PKG_NAME%" is not installed.
    exit /b 1
)

echo [EMU] Resolving package "%PKG_NAME%" from index...
call :get_pkg_url

echo [EMU] Package URL: %PKG_URL%

set "TMP_ZIP=%TEMP%\%PKG_NAME%_emu_pkg_new.zip"
set "TMP_EXTRACT=%TEMP%\%PKG_NAME%_emu_pkg_new"

del /f /q "%TMP_ZIP%" >nul 2>&1
rmdir /s /q "%TMP_EXTRACT%" >nul 2>&1

echo [EMU] Downloading latest package...
powershell -NoProfile -Command ^
  "Invoke-WebRequest -Uri '%PKG_URL%' -OutFile '%TMP_ZIP%'" || (
    echo [EMU] ERROR: Failed to download package.
    exit /b 1
)

echo [EMU] Extracting latest package to temp...
mkdir "%TMP_EXTRACT%" 2>nul
powershell -NoProfile -Command ^
  "Expand-Archive -LiteralPath '%TMP_ZIP%' -DestinationPath '%TMP_EXTRACT%' -Force" || (
    echo [EMU] ERROR: Failed to extract new package.
    exit /b 1
)

echo [EMU] Comparing installed vs latest...
powershell -NoProfile -Command ^
  "$folder1 = '%PKG_DIR%';" ^
  "$folder2 = '%TMP_EXTRACT%';" ^
  "$f1 = Get-ChildItem -Path $folder1 -File -Recurse | ForEach-Object { [PSCustomObject]@{ RelativePath = $_.FullName.Substring((Resolve-Path $folder1).Path.Length + 1); Hash = (Get-FileHash $_.FullName).Hash } };" ^
  "$f2 = Get-ChildItem -Path $folder2 -File -Recurse | ForEach-Object { [PSCustomObject]@{ RelativePath = $_.FullName.Substring((Resolve-Path $folder2).Path.Length + 1); Hash = (Get-FileHash $_.FullName).Hash } };" ^
  "$diff = Compare-Object -ReferenceObject $f1 -DifferenceObject $f2 -Property RelativePath, Hash -PassThru;" ^
  "if ($diff) { exit 0 } else { exit 1 }"

if errorlevel 1 (
    echo [EMU] NO Updates Detected.
    rmdir /s /q "%TMP_EXTRACT%" >nul 2>&1
    del /f /q "%TMP_ZIP%" >nul 2>&1
    exit /b 0
)

echo [EMU] Changes detected. Updating "%PKG_NAME%"...
rmdir /s /q "%PKG_DIR%" >nul 2>&1
mkdir "%PKG_DIR%" 2>nul

xcopy "%TMP_EXTRACT%\*" "%PKG_DIR%\" /E /I /Y >nul
if errorlevel 1 (
    echo [EMU] ERROR: Failed to update package files.
    exit /b 1
)

rmdir /s /q "%TMP_EXTRACT%" >nul 2>&1
del /f /q "%TMP_ZIP%" >nul 2>&1

echo [EMU] Updated "%PKG_NAME%".
exit /b 0

rem -------------------------
:updateself
call :check_online

set "SELF_DIR=%~dp0"
set "SELF_CUR=%SELF_DIR%emu.bat"
set "SELF_NEW=%SELF_DIR%emu_new.bat"
set "SELF_OLD=%SELF_DIR%emu_old.bat"

echo [EMU] Downloading new emu.bat...
powershell -NoProfile -Command ^
  "Invoke-WebRequest -Uri '%SELF_URL%' -OutFile '%SELF_NEW%'" || (
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

rem -------------------------
:compile
call :check_folder

rem remove the "compile" token
shift

rem -------------------------
rem Robust file collection + flags
rem - collects quoted or unquoted file path tokens until a token starting with --
rem - uses CALL for safe substring extraction
rem -------------------------
set "EMU_FILE="
set "IN_QUOTE=0"

:collect_loop
if "%~1"=="" goto :no_file

rem store current token (unquoted)
set "tok=%~1"

rem get first two chars safely via CALL
call set "tok2=%%tok:~0,2%%"
if "%IN_QUOTE%"=="0" if "%tok2%"=="--" goto :flags_start

rem get first char safely
call set "tok1=%%tok:~0,1%%"
if "%IN_QUOTE%"=="0" ( if "%tok1%"=="\\\"" set "IN_QUOTE=1" )

rem append token (preserve spaces)
if defined EMU_FILE (
    set "EMU_FILE=!EMU_FILE! %~1"
) else (
    set "EMU_FILE=%~1"
)

rem if in quoted capture, check if this token ends the quote
if "%IN_QUOTE%"=="1" (
    call set "lastc=%%tok:~-1%%"
    if "%lastc%"=="\\\"" (`n        set "IN_QUOTE=0"`n        shift`n        goto :flags_start`n    )
    shift
    goto :collect_loop
)

shift
goto :collect_loop

:flags_start
if not defined EMU_FILE goto :no_file

rem Trim surrounding quotes if present (safe via CALL)
call set "firstc=%%EMU_FILE:~0,1%%"
if "%firstc%"=="\\\"" ( call set "EMU_FILE=%%EMU_FILE:~1%%" )
call set "lastc=%%EMU_FILE:~-1%%"
if "%lastc%"=="\\\"" ( call set "EMU_FILE=%%EMU_FILE:~0,-1%%" )

rem Convert forward slashes to backslashes only inside the file path
call set "EMU_FILE=%%EMU_FILE:/=\%%"

rem Now parse flags (remaining tokens)
set "INCLUDE_ALL=0"
set "INCLUDE_LIST="

:flag_loop
if "%~1"=="" goto :compile_start2
set "f=%~1"
if /I "%f%"=="--AllPackage" set "INCLUDE_ALL=1"
if /I "%f%"=="--AllPackages" set "INCLUDE_ALL=1"
call set "pref=%%f:~0,10%%"
if /I "%pref%"=="--include:" (
    call set "INCLUDE_LIST=%%f:~10%%"
)
shift
goto :flag_loop

:compile_start2
rem Diagnostic: show parsed values
echo [EMU] DEBUG: Parsed EMU_FILE="%EMU_FILE%"
echo [EMU] DEBUG: INCLUDE_ALL=%INCLUDE_ALL%  INCLUDE_LIST=%INCLUDE_LIST%

if not exist "%EMU_FILE%" (
    echo [EMU] ERROR: Emulator file "%EMU_FILE%" not found.
    exit /b 1
)

set "OUT_DIR=%CD%\EMUPUT"
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

for %%F in ("%EMU_FILE%") do set "OUT_NAME=%%~nF"
set "OUT_FILE=%OUT_DIR%\%OUT_NAME%.emuarg"

echo [EMU] Compiling "%EMU_FILE%"...

rem -------------------------
rem Bytecode compiler placeholder: raw bytes -> base64
rem Replace with your real compiler invocation if needed
rem -------------------------
powershell -NoProfile -Command ^
  "$in = '%EMU_FILE%';" ^
  "if (-not (Test-Path $in)) { exit 2 };" ^
  "$b = [IO.File]::ReadAllBytes($in);" ^
  "$s = [Convert]::ToBase64String($b);" ^
  "[IO.File]::WriteAllText('%OUT_FILE%', '-----BEGIN EMULATOR-----`n' + $s + '`n-----END EMULATOR-----`n')"

if errorlevel 2 (
    echo [EMU] ERROR: PowerShell could not find the input file.
    exit /b 1
)

rem -------------------------
rem Dependencies handling
rem -------------------------
if "%INCLUDE_ALL%"=="1" goto :compile_all_deps
if defined INCLUDE_LIST goto :compile_specific_deps
goto :compile_done

:compile_all_deps
echo [EMU] Including ALL packages...
set "TMP_DEP=%TEMP%\emu_deps.zip"
del /f /q "%TMP_DEP%" >nul 2>&1

powershell -NoProfile -Command ^
  "Compress-Archive -Path '%EMU_BASE%\*' -DestinationPath '%TMP_DEP%' -Force"

goto :encode_deps

:compile_specific_deps
echo [EMU] Including specific packages...
set "TMP_DEP=%TEMP%\emu_deps.zip"
del /f /q "%TMP_DEP%" >nul 2>&1

set "PKGS=%INCLUDE_LIST:,= %"

set "TMP_DEP_DIR=%TEMP%\emu_dep_tmp"
rmdir /s /q "%TMP_DEP_DIR%" >nul 2>&1
mkdir "%TMP_DEP_DIR%" >nul 2>&1

for %%P in (%PKGS%) do (
    if exist "%EMU_BASE%\%%P" (
        xcopy "%EMU_BASE%\%%P" "%TMP_DEP_DIR%\%%P\" /E /I /Y >nul
    ) else (
        echo [EMU] WARNING: Package "%%P" not installed.
    )
)

powershell -NoProfile -Command ^
  "Compress-Archive -Path '%TMP_DEP_DIR%\*' -DestinationPath '%TMP_DEP%' -Force"

goto :encode_deps

:encode_deps
echo [EMU] Encoding dependencies...
powershell -NoProfile -Command ^
  "$b=[IO.File]::ReadAllBytes('%TMP_DEP%');" ^
  "$s=[Convert]::ToBase64String($b);" ^
  "[IO.File]::AppendAllText('%OUT_FILE%', '-----BEGIN DEPENDENCIES-----`n'+$s+'`n-----END DEPENDENCIES-----')"

del /f /q "%TMP_DEP%" >nul 2>&1
rmdir /s /q "%TMP_DEP_DIR%" >nul 2>&1

:compile_done
echo [EMU] Compile complete: "%OUT_FILE%"
exit /b 0

:no_file
echo [EMU] ERROR: No emulator file specified.
exit /b 1
