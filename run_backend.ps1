# Seasonal Medicine Recommendation System - Backend Startup Script
# This script ensures the virtual environment is activated before running the backend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SEASONAL MEDICINE RECOMMENDATION SYSTEM" -ForegroundColor Cyan
Write-Host "Backend Server Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Change to the project directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptPath

# Check if .venv exists
if (-not (Test-Path ".venv")) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run: python -m venv .venv" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
& ".venv\Scripts\Activate.ps1"

# Check if activation was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to activate virtual environment!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Virtual environment activated successfully!" -ForegroundColor Green

# Change to backend directory
Set-Location "backend"

# Check if app.py exists
if (-not (Test-Path "app.py")) {
    Write-Host "ERROR: app.py not found in backend directory!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting Flask backend server..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Run the Flask application
try {
    python app.py
} catch {
    Write-Host "ERROR: Backend server failed to start!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
}


