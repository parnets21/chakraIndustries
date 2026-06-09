@echo off
echo.
echo ================================================
echo   Cleaning Metro Cache and Starting App
echo ================================================
echo.

REM Change to app directory
cd /d "%~dp0"

echo Step 1: Cleaning Metro cache...
echo.

REM Delete Metro cache
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo    [OK] Deleted node_modules\.cache
) else (
    echo    [SKIP] node_modules\.cache not found
)

REM Delete temp Metro files
del /q /f "%TEMP%\metro-*" 2>nul
del /q /f "%TEMP%\react-*" 2>nul
del /q /f "%TEMP%\haste-*" 2>nul
echo    [OK] Deleted temp files

REM Delete watchman cache
if exist "%LOCALAPPDATA%\Temp\watchman" (
    rmdir /s /q "%LOCALAPPDATA%\Temp\watchman"
    echo    [OK] Deleted watchman cache
)

echo.
echo Step 2: Starting Metro bundler with clean cache...
echo.

REM Start Metro with reset cache
npm start -- --reset-cache

pause
