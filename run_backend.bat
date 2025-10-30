@echo off
echo ========================================
echo SEASONAL MEDICINE RECOMMENDATION SYSTEM
echo Backend Server Startup Script
echo ========================================

REM Change to the project directory
cd /d "%~dp0"

REM Check if .venv exists
if not exist ".venv" (
    echo ERROR: Virtual environment not found!
    echo Please run: python -m venv .venv
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate.bat

REM Check if activation was successful
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment!
    pause
    exit /b 1
)

echo Virtual environment activated successfully!

REM Change to backend directory
cd backend

REM Check if app.py exists
if not exist "app.py" (
    echo ERROR: app.py not found in backend directory!
    pause
    exit /b 1
)

echo Starting Flask backend server...
echo ========================================

REM Run the Flask application
python app.py

REM Keep window open if there's an error
if errorlevel 1 (
    echo.
    echo ERROR: Backend server failed to start!
    pause
)


