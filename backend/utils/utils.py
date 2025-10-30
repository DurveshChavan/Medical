"""
Utility functions for the Seasonal Medicine Recommendation System.
General helper functions for timestamping, logging, file validation, etc.
"""

import os
import json
import logging
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
import pandas as pd

from config import (
    INPUT_DIR, OUTPUT_DIR, VALIDATION_RULES, 
    SEASONS, CHART_CONFIG, LOGGING_CONFIG
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOGGING_CONFIG['level']),
    format=LOGGING_CONFIG['format']
)
logger = logging.getLogger(__name__)


class FileValidator:
    """Handles file validation operations."""
    
    @staticmethod
    def validate_csv_file(file_path: Union[str, Path]) -> Dict[str, Any]:
        """
        Validate a CSV file for required structure and content.
        
        Args:
            file_path (Union[str, Path]): Path to CSV file
            
        Returns:
            Dict[str, Any]: Validation results
        """
        file_path = Path(file_path)
        validation_result = {
            'is_valid': False,
            'errors': [],
            'warnings': [],
            'file_info': {},
            'data_info': {}
        }
        
        try:
            # Check if file exists
            if not file_path.exists():
                validation_result['errors'].append(f"File does not exist: {file_path}")
                return validation_result
            
            # Check file size
            file_size = file_path.stat().st_size
            validation_result['file_info']['size_bytes'] = file_size
            validation_result['file_info']['size_mb'] = round(file_size / (1024 * 1024), 2)
            
            if file_size == 0:
                validation_result['errors'].append("File is empty")
                return validation_result
            
            # Check file extension
            if file_path.suffix.lower() != '.csv':
                validation_result['warnings'].append(f"File extension is {file_path.suffix}, expected .csv")
            
            # Try to read CSV
            try:
                df = pd.read_csv(file_path, nrows=5)  # Read only first 5 rows for validation
                validation_result['data_info']['columns'] = df.columns.tolist()
                validation_result['data_info']['shape'] = df.shape
                
                # Check required columns
                missing_columns = set(VALIDATION_RULES['required_columns']) - set(df.columns)
                if missing_columns:
                    validation_result['errors'].append(f"Missing required columns: {list(missing_columns)}")
                
                # Check critical columns
                critical_missing = set(VALIDATION_RULES['critical_columns']) - set(df.columns)
                if critical_missing:
                    validation_result['errors'].append(f"Missing critical columns: {list(critical_missing)}")
                
                # Check data types for critical columns
                for col in VALIDATION_RULES['critical_columns']:
                    if col in df.columns:
                        if col == 'date':
                            try:
                                pd.to_datetime(df[col].iloc[0])
                            except:
                                validation_result['warnings'].append(f"Date column '{col}' may have invalid format")
                        elif col in ['quantity', 'unit_price']:
                            if not pd.api.types.is_numeric_dtype(df[col]):
                                validation_result['warnings'].append(f"Column '{col}' should be numeric")
                
                validation_result['is_valid'] = len(validation_result['errors']) == 0
                
            except Exception as e:
                validation_result['errors'].append(f"Error reading CSV: {str(e)}")
            
        except Exception as e:
            validation_result['errors'].append(f"File validation error: {str(e)}")
        
        return validation_result
    
    @staticmethod
    def get_file_hash(file_path: Union[str, Path]) -> str:
        """
        Calculate MD5 hash of a file.
        
        Args:
            file_path (Union[str, Path]): Path to file
            
        Returns:
            str: MD5 hash of the file
        """
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()


class DataProcessor:
    """Handles data processing utilities."""
    
    @staticmethod
    def clean_medicine_name(name: str) -> str:
        """
        Clean and standardize medicine name.
        
        Args:
            name (str): Raw medicine name
            
        Returns:
            str: Cleaned medicine name
        """
        if pd.isna(name) or name is None:
            return "UNKNOWN"
        
        import re
        return re.sub(r'\s+', ' ', str(name).strip().upper())
    
    @staticmethod
    def get_season_from_date(date_str: Union[str, datetime]) -> str:
        """
        Determine season from date based on Indian climate.
        
        Args:
            date_str (Union[str, datetime]): Date string or datetime object
            
        Returns:
            str: Season name
        """
        if isinstance(date_str, str):
            try:
                date_obj = pd.to_datetime(date_str)
            except:
                return "Unknown"
        else:
            date_obj = date_str
        
        month = date_obj.month
        
        if month in [2, 3, 4, 5]:
            return 'Summer'
        elif month in [6, 7, 8, 9]:
            return 'Monsoon'
        else:  # [10, 11, 12, 1]
            return 'Winter'
    
    @staticmethod
    def calculate_daily_average(quantity: int, days: int) -> float:
        """
        Calculate daily average from total quantity and days.
        
        Args:
            quantity (int): Total quantity
            days (int): Number of days
            
        Returns:
            float: Daily average
        """
        if days <= 0:
            return 0.0
        return round(quantity / days, 2)
    
    @staticmethod
    def apply_safety_buffer(quantity: int, buffer_percentage: float = 0.15) -> int:
        """
        Apply safety buffer to quantity.
        
        Args:
            quantity (int): Base quantity
            buffer_percentage (float): Buffer percentage (default 0.15 = 15%)
            
        Returns:
            int: Quantity with buffer applied
        """
        return int(quantity * (1 + buffer_percentage))


class FileManager:
    """Handles file operations and management."""
    
    @staticmethod
    def ensure_output_directory() -> Path:
        """
        Ensure output directory exists.
        
        Returns:
            Path: Output directory path
        """
        OUTPUT_DIR.mkdir(exist_ok=True)
        return OUTPUT_DIR
    
    @staticmethod
    def save_json(data: Dict[str, Any], filename: str) -> Path:
        """
        Save data as JSON file.
        
        Args:
            data (Dict[str, Any]): Data to save
            filename (str): Filename
            
        Returns:
            Path: Path to saved file
        """
        output_dir = FileManager.ensure_output_directory()
        file_path = output_dir / filename
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False, default=str)
        
        logger.info(f"JSON file saved: {file_path}")
        return file_path
    
    @staticmethod
    def save_csv(df: pd.DataFrame, filename: str) -> Path:
        """
        Save DataFrame as CSV file.
        
        Args:
            df (pd.DataFrame): DataFrame to save
            filename (str): Filename
            
        Returns:
            Path: Path to saved file
        """
        output_dir = FileManager.ensure_output_directory()
        file_path = output_dir / filename
        
        df.to_csv(file_path, index=False)
        logger.info(f"CSV file saved: {file_path}")
        return file_path
    
    @staticmethod
    def get_timestamped_filename(base_name: str, extension: str = '') -> str:
        """
        Generate timestamped filename.
        
        Args:
            base_name (str): Base filename
            extension (str): File extension
            
        Returns:
            str: Timestamped filename
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if extension and not extension.startswith('.'):
            extension = f'.{extension}'
        return f"{base_name}_{timestamp}{extension}"


class Logger:
    """Enhanced logging utilities."""
    
    @staticmethod
    def log_analysis_start(analysis_type: str, parameters: Dict[str, Any]):
        """
        Log analysis start.
        
        Args:
            analysis_type (str): Type of analysis
            parameters (Dict[str, Any]): Analysis parameters
        """
        logger.info(f"Starting {analysis_type} analysis")
        logger.info(f"Parameters: {parameters}")
    
    @staticmethod
    def log_analysis_complete(analysis_type: str, results: Dict[str, Any]):
        """
        Log analysis completion.
        
        Args:
            analysis_type (str): Type of analysis
            results (Dict[str, Any]): Analysis results
        """
        logger.info(f"Completed {analysis_type} analysis")
        logger.info(f"Results summary: {results}")
    
    @staticmethod
    def log_error(error: Exception, context: str = ""):
        """
        Log error with context.
        
        Args:
            error (Exception): Error object
            context (str): Error context
        """
        logger.error(f"Error in {context}: {str(error)}")
        logger.error(f"Error type: {type(error).__name__}")


class DataValidator:
    """Data validation utilities."""
    
    @staticmethod
    def validate_dataframe(df: pd.DataFrame, required_columns: List[str]) -> Dict[str, Any]:
        """
        Validate DataFrame structure and content.
        
        Args:
            df (pd.DataFrame): DataFrame to validate
            required_columns (List[str]): Required columns
            
        Returns:
            Dict[str, Any]: Validation results
        """
        validation_result = {
            'is_valid': True,
            'errors': [],
            'warnings': [],
            'stats': {}
        }
        
        try:
            # Check shape
            validation_result['stats']['rows'] = len(df)
            validation_result['stats']['columns'] = len(df.columns)
            
            if len(df) == 0:
                validation_result['errors'].append("DataFrame is empty")
                validation_result['is_valid'] = False
            
            # Check required columns
            missing_columns = set(required_columns) - set(df.columns)
            if missing_columns:
                validation_result['errors'].append(f"Missing required columns: {list(missing_columns)}")
                validation_result['is_valid'] = False
            
            # Check for null values in critical columns
            critical_columns = VALIDATION_RULES['critical_columns']
            for col in critical_columns:
                if col in df.columns:
                    null_count = df[col].isnull().sum()
                    if null_count > 0:
                        validation_result['warnings'].append(f"Column '{col}' has {null_count} null values")
            
            # Check data types
            for col in ['quantity', 'unit_price']:
                if col in df.columns:
                    if not pd.api.types.is_numeric_dtype(df[col]):
                        validation_result['errors'].append(f"Column '{col}' should be numeric")
                        validation_result['is_valid'] = False
            
        except Exception as e:
            validation_result['errors'].append(f"Validation error: {str(e)}")
            validation_result['is_valid'] = False
        
        return validation_result


def get_current_timestamp() -> str:
    """
    Get current timestamp string.
    
    Returns:
        str: Current timestamp
    """
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def format_currency(amount: float, currency: str = "INR") -> str:
    """
    Format amount as currency.
    
    Args:
        amount (float): Amount to format
        currency (str): Currency code
        
    Returns:
        str: Formatted currency string
    """
    if currency == "INR":
        return f"₹{amount:,.2f}"
    else:
        return f"{currency} {amount:,.2f}"


def format_number(number: Union[int, float]) -> str:
    """
    Format number with thousand separators.
    
    Args:
        number (Union[int, float]): Number to format
        
    Returns:
        str: Formatted number string
    """
    return f"{number:,}"


def safe_filename(filename: str) -> str:
    """
    Create safe filename by removing/replacing invalid characters.
    
    Args:
        filename (str): Original filename
        
    Returns:
        str: Safe filename
    """
    import re
    # Replace invalid characters with underscores
    safe_name = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove multiple consecutive underscores
    safe_name = re.sub(r'_+', '_', safe_name)
    # Remove leading/trailing underscores
    safe_name = safe_name.strip('_')
    return safe_name
