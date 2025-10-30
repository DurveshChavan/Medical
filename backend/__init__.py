"""
Seasonal Medicine Recommendation System - Backend Package

This package contains the refactored backend components for the Seasonal Medicine 
Recommendation System, extracted from the monolithic Engine.py file.

Components:
- config.py: Configuration and constants
- database.py: Database connection and management
- models.py: Database schemas and models
- data_loader.py: CSV loading and database population
- analyzer.py: Analytical and statistical processing
- routes.py: Flask API endpoints
- utils.py: Utility functions
- app.py: Flask application entry point

Usage:
    from backend import create_app, run_development_server
    app = create_app()
    run_development_server()
"""

__version__ = "1.0.0"
__author__ = "Seasonal Medicine Recommendation System"
__description__ = "Backend system for seasonal medicine analysis and recommendations"

# Import main components for easy access
from .config import *
from .app import create_app, run_development_server, get_application_info
from .database import get_database_manager, init_database, get_database_status
from .models import initialize_database_schema, get_database_schema_info
from .data_loader import load_csv_data, get_data_loading_status
from .analyzer import run_analysis
from .utils import Logger, FileManager, DataValidator

__all__ = [
    'create_app',
    'run_development_server', 
    'get_application_info',
    'get_database_manager',
    'init_database',
    'get_database_status',
    'initialize_database_schema',
    'get_database_schema_info',
    'load_csv_data',
    'get_data_loading_status',
    'run_analysis',
    'Logger',
    'FileManager',
    'DataValidator'
]
