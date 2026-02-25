@echo off
echo ====================================================
echo    Barida Recipe Manager - Installer Builder
echo ====================================================
echo.

cd /d "%~dp0"

echo Checking for Inno Setup...
set "ISCC=%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe"

if not exist "%ISCC%" (
    echo ERROR: Inno Setup not found at %ISCC%
    echo Please install Inno Setup 6 from: https://jrsoftware.org/isdl.php
    pause
    exit /b 1
)

echo Found Inno Setup at: %ISCC%
echo.
echo Compiling installer...
echo.

"%ISCC%" setup.iss

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================
    echo    BUILD SUCCESSFUL!
    echo    Installer created in: Output\
    echo ====================================================
) else (
    echo.
    echo ====================================================
    echo    BUILD FAILED! Check errors above.
    echo ====================================================
)

echo.
pause
