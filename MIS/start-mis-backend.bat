@echo off
cls
echo ============================================================
echo   MIS BACKEND LAUNCHER
echo ============================================================
echo.
cd /d "%~dp0"

REM Check if virtual environment exists
if not exist ".venv" (
    echo [1/3] Creating virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Install/Update dependencies
echo [1/3] Installing dependencies...
pip install -r requirements.txt >nul 2>&1
echo [1/3] Dependencies ready

REM Check for --reload flag
echo [2/3] Checking startup mode...
set RELOAD_FLAG=
echo %* | findstr /C:"--reload" >nul 2>&1
if not errorlevel 1 (
    set RELOAD_FLAG=--reload
    echo [2/3] Hot-reload mode ENABLED
) else (
    echo [2/3] Standard mode
)

REM Start FastAPI server
echo.
echo [3/3] Starting MIS Backend on port 3003...
echo.
if "%RELOAD_FLAG%"=="--reload" (
    python MISBACKEND.py --reload
) else (
    python MISBACKEND.py
)

pause
