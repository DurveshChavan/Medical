"""
Configuration file for the Seasonal Medicine Recommendation System.
Contains all dynamic paths, environment constants, and configuration settings.
"""

import os
from pathlib import Path

# Base project directory
BASE_DIR = Path(__file__).parent.parent

# Directory paths
INPUT_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"
DATABASE_DIR = BASE_DIR / "database"
BACKEND_DIR = BASE_DIR / "backend"

# File paths
DATABASE_PATH = DATABASE_DIR / "pharmacy_backup.db"

# Create directories if they don't exist
for directory in [INPUT_DIR, OUTPUT_DIR, DATABASE_DIR]:
    directory.mkdir(exist_ok=True)

# CSV file configuration
CSV_REQUIRED_COLUMNS = [
    'date', 'time', 'invoice_id', 'medicine_name', 'generic_name',
    'brand', 'manufacturer', 'supplier', 'dosage_form', 'strength',
    'category', 'prescription_required', 'quantity', 'unit_price'
]

# Database configuration
DB_CONFIG = {
    'database_path': str(DATABASE_PATH),
    'timeout': 30,
    'check_same_thread': False
}

# Analysis configuration
ANALYSIS_CONFIG = {
    'buffer_percentage': 0.15,  # 15% safety stock buffer
    'fast_mover_threshold': 0.75,  # 75th percentile for fast movers
    'forecast_weeks': 12,
    'forecast_months': 3,
    'min_data_points_sarima': 24,  # Minimum weeks for SARIMA
    'min_data_points_prophet': 30   # Minimum days for Prophet
}

# Season configuration (Indian climate)
SEASONS = {
    'Summer': {
        'months': [2, 3, 4, 5],
        'month_names': 'February to May',
        'order_before': 'Late January',
        'peak_months': 'March-April',
        'duration_days': 120
    },
    'Monsoon': {
        'months': [6, 7, 8, 9],
        'month_names': 'June to September',
        'order_before': 'Late May',
        'peak_months': 'July-August',
        'duration_days': 120
    },
    'Winter': {
        'months': [10, 11, 12, 1],
        'month_names': 'October to January',
        'order_before': 'Late September',
        'peak_months': 'November-December',
        'duration_days': 120
    }
}

# Flask configuration
FLASK_CONFIG = {
    'host': '127.0.0.1',
    'port': 5000,
    'debug': True,
    'upload_folder': str(INPUT_DIR),
    'max_content_length': 16 * 1024 * 1024  # 16MB max file size
}

# Output file naming patterns
OUTPUT_PATTERNS = {
    'recommendations_json': 'recommendations_{season}.json',
    'recommendations_csv': 'recommendations_{season}.csv',
    'recommendations_excel': 'recommendations_{season}_detailed.xlsx',
    'ordering_guide': 'ORDERING_GUIDE_{season}.txt',
    'medicine_master': 'medicine_master_list.csv',
    'seasonal_overview': '01_seasonal_sales_overview.png',
    'top_medicines': '02_top_medicines_by_season.png',
    'trends_analysis': '03_medicine_trends_analysis.png',
    'sarima_forecast': '04_sarima_forecast_{medicine}.png',
    'prophet_forecast': '05_prophet_forecast_{medicine}.png',
    'actionable_dashboard': '06_actionable_dashboard_{season}.png'
}

# Logging configuration
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': str(OUTPUT_DIR / 'system.log')
}

# Data validation rules
VALIDATION_RULES = {
    'required_columns': CSV_REQUIRED_COLUMNS,
    'critical_columns': ['date', 'medicine_name', 'quantity', 'unit_price'],
    'date_format': '%Y-%m-%d',
    'time_format': '%H:%M:%S',
    'min_quantity': 1,
    'min_unit_price': 0.01,
    'max_quantity': 10000,
    'max_unit_price': 100000
}

# Priority levels for medicine categorization
PRIORITY_LEVELS = {
    'CRITICAL': 0.20,  # Top 20%
    'HIGH': 0.30,      # Next 30%
    'MEDIUM': 0.30,     # Next 30%
    'LOW': 0.20         # Remaining 20%
}

# Chart styling configuration
CHART_CONFIG = {
    'figure_size': (14, 6),
    'dpi': 300,
    'style': 'whitegrid',
    'colors': {
        'summer': '#FF6B6B',
        'monsoon': '#4ECDC4',
        'winter': '#45B7D1',
        'critical': '#E74C3C',
        'high': '#F39C12',
        'medium': '#3498DB',
        'low': '#95A5A6'
    }
}
