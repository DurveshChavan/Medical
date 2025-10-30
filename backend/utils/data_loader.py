"""
Data loading module for CSV files.
Reads uploaded CSV files from /input, validates them, and loads data into the database.
"""

import pandas as pd
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

from config import INPUT_DIR, CSV_REQUIRED_COLUMNS, VALIDATION_RULES
from models.database import get_database_manager
from .utils import FileValidator, DataProcessor, Logger, DataValidator
from models.models import DatabaseSchema

logger = logging.getLogger(__name__)


class CSVLoader:
    """Handles CSV file loading and validation."""
    
    def __init__(self):
        self.db_manager = get_database_manager()
        self.file_validator = FileValidator()
        self.data_processor = DataProcessor()
        self.data_validator = DataValidator()
    
    def load_csv_file(self, file_path: Path) -> Tuple[bool, Optional[pd.DataFrame], Dict[str, Any]]:
        """
        Load and validate a CSV file.
        
        Args:
            file_path (Path): Path to CSV file
            
        Returns:
            Tuple[bool, Optional[pd.DataFrame], Dict[str, Any]]: 
                (success, dataframe, validation_info)
        """
        Logger.log_analysis_start("CSV Loading", {"file_path": str(file_path)})
        
        try:
            # Validate file
            validation_result = self.file_validator.validate_csv_file(file_path)
            
            if not validation_result['is_valid']:
                logger.error(f"CSV validation failed: {validation_result['errors']}")
                return False, None, validation_result
            
            # Load CSV
            logger.info(f"Loading CSV file: {file_path}")
            df = pd.read_csv(file_path)
            
            # Validate DataFrame
            df_validation = self.data_validator.validate_dataframe(df, CSV_REQUIRED_COLUMNS)
            
            if not df_validation['is_valid']:
                logger.error(f"DataFrame validation failed: {df_validation['errors']}")
                return False, None, df_validation
            
            # Clean and preprocess data
            df_cleaned = self._clean_dataframe(df)
            
            Logger.log_analysis_complete("CSV Loading", {
                "rows_loaded": len(df_cleaned),
                "columns": len(df_cleaned.columns),
                "warnings": df_validation['warnings']
            })
            
            return True, df_cleaned, df_validation
            
        except Exception as e:
            Logger.log_error(e, "CSV Loading")
            return False, None, {"error": str(e)}
    
    def _clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and preprocess DataFrame.
        
        Args:
            df (pd.DataFrame): Raw DataFrame
            
        Returns:
            pd.DataFrame: Cleaned DataFrame
        """
        logger.info("Starting data cleaning...")
        
        df_clean = df.copy()
        initial_rows = len(df_clean)
        
        # Handle missing values in critical columns
        critical_columns = VALIDATION_RULES['critical_columns']
        df_clean.dropna(subset=critical_columns, inplace=True)
        
        # Convert data types
        df_clean['date'] = pd.to_datetime(df_clean['date'], errors='coerce')
        
        # Create datetime column
        try:
            df_clean['datetime'] = pd.to_datetime(
                df_clean['date'].astype(str) + ' ' + df_clean['time'].astype(str),
                errors='coerce'
            )
        except:
            df_clean['datetime'] = df_clean['date']
        
        # Convert numeric columns
        df_clean['quantity'] = pd.to_numeric(df_clean['quantity'], errors='coerce')
        df_clean['unit_price'] = pd.to_numeric(df_clean['unit_price'], errors='coerce')
        
        # Remove invalid records
        df_clean = df_clean.dropna(subset=['quantity', 'unit_price'])
        df_clean = df_clean[df_clean['quantity'] > 0]
        df_clean = df_clean[df_clean['unit_price'] > 0]
        
        # Clean medicine names
        df_clean['medicine_name_clean'] = df_clean['medicine_name'].apply(
            self.data_processor.clean_medicine_name
        )
        
        # Clean generic names
        df_clean['generic_name_clean'] = (
            df_clean['generic_name']
            .fillna('UNKNOWN')
            .apply(self.data_processor.clean_medicine_name)
        )
        
        # Add calculated fields
        df_clean['total_sales'] = df_clean['quantity'] * df_clean['unit_price']
        
        # Add seasonal features
        df_clean['season'] = df_clean['date'].apply(self.data_processor.get_season_from_date)
        
        # Add time features
        df_clean['year'] = df_clean['date'].dt.year
        df_clean['month'] = df_clean['date'].dt.month
        df_clean['day'] = df_clean['date'].dt.day
        df_clean['day_of_week'] = df_clean['date'].dt.dayofweek
        df_clean['week_of_year'] = df_clean['date'].dt.isocalendar().week
        df_clean['quarter'] = df_clean['date'].dt.quarter
        
        final_rows = len(df_clean)
        rows_removed = initial_rows - final_rows
        
        logger.info(f"Data cleaning completed: {rows_removed} rows removed, {final_rows} rows remaining")
        
        return df_clean


class DatabaseLoader:
    """Handles loading data into the database."""
    
    def __init__(self):
        self.db_manager = get_database_manager()
    
    def load_sales_data(self, df: pd.DataFrame) -> bool:
        """
        Load sales data into the database.
        
        Args:
            df (pd.DataFrame): Cleaned sales DataFrame
            
        Returns:
            bool: True if successful, False otherwise
        """
        Logger.log_analysis_start("Database Loading", {"rows": len(df)})
        
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Clear existing sales data
                cursor.execute("DELETE FROM sales")
                logger.info("Cleared existing sales data")
                
                # Prepare data for insertion
                sales_data = []
                for _, row in df.iterrows():
                    sales_data.append((
                        row['date'].strftime('%Y-%m-%d'),
                        row['time'],
                        row['invoice_id'],
                        row['medicine_name'],
                        row['generic_name'],
                        row['brand'],
                        row['manufacturer'],
                        row['supplier'],
                        row['dosage_form'],
                        row['strength'],
                        row['category'],
                        int(row['prescription_required']),
                        int(row['quantity']),
                        float(row['unit_price'])
                    ))
                
                # Insert data in batches
                batch_size = 1000
                for i in range(0, len(sales_data), batch_size):
                    batch = sales_data[i:i + batch_size]
                    cursor.executemany("""
                        INSERT INTO sales (
                            date, time, invoice_id, medicine_name, generic_name,
                            brand, manufacturer, supplier, dosage_form, strength,
                            category, prescription_required, quantity, unit_price
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, batch)
                    
                    logger.info(f"Inserted batch {i//batch_size + 1}: {len(batch)} records")
                
                conn.commit()
                logger.info(f"Successfully loaded {len(sales_data)} sales records")
                
                return True
                
        except Exception as e:
            Logger.log_error(e, "Database Loading")
            return False
    


class DataLoader:
    """Main data loader class that orchestrates the loading process."""
    
    def __init__(self):
        self.csv_loader = CSVLoader()
        self.db_loader = DatabaseLoader()
    
    def load_data_from_csv(self, file_path: Path) -> Dict[str, Any]:
        """
        Complete data loading process from CSV to database.
        
        Args:
            file_path (Path): Path to CSV file
            
        Returns:
            Dict[str, Any]: Loading results
        """
        Logger.log_analysis_start("Complete Data Loading", {"file_path": str(file_path)})
        
        results = {
            'success': False,
            'csv_loaded': False,
            'database_loaded': False,
            'errors': [],
            'warnings': [],
            'stats': {}
        }
        
        try:
            # Step 1: Load and validate CSV
            csv_success, df, validation_info = self.csv_loader.load_csv_file(file_path)
            
            if not csv_success:
                results['errors'].extend(validation_info.get('errors', []))
                results['warnings'].extend(validation_info.get('warnings', []))
                return results
            
            results['csv_loaded'] = True
            results['stats']['rows_loaded'] = len(df)
            results['stats']['columns'] = len(df.columns)
            results['warnings'].extend(validation_info.get('warnings', []))
            
            # Step 2: Load sales data into database
            sales_success = self.db_loader.load_sales_data(df)
            if not sales_success:
                results['errors'].append("Failed to load sales data into database")
                return results
            
            results['database_loaded'] = True
            
            # Step 3: Medicine master creation removed (table no longer exists)
            results['success'] = True
            
            Logger.log_analysis_complete("Complete Data Loading", results)
            
        except Exception as e:
            Logger.log_error(e, "Complete Data Loading")
            results['errors'].append(str(e))
        
        return results
    
    def get_loading_status(self) -> Dict[str, Any]:
        """
        Get current loading status and database info.
        
        Returns:
            Dict[str, Any]: Loading status
        """
        try:
            db_status = self.csv_loader.db_manager.get_database_info()
            
            # Get record counts
            with self.csv_loader.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("SELECT COUNT(*) FROM sales")
                sales_count = cursor.fetchone()[0]
                
                # medicine_master table removed
                medicine_count = 0
                
                cursor.execute("SELECT COUNT(DISTINCT medicine_name) FROM sales")
                unique_medicines = cursor.fetchone()[0]
            
            return {
                'database_exists': db_status['exists'],
                'sales_records': sales_count,
                'unique_medicines': unique_medicines,
                'database_size_mb': db_status['file_size_mb']
            }
            
        except Exception as e:
            Logger.log_error(e, "Loading Status")
            return {'error': str(e)}


def load_csv_data(file_path: Path, database_path: str = None) -> Dict[str, Any]:
    """
    Load CSV data into the database.
    
    Args:
        file_path (Path): Path to CSV file
        database_path (str, optional): Custom database path for sandbox mode
        
    Returns:
        Dict[str, Any]: Loading results
    """
    loader = DataLoader()
    if database_path:
        # Create a custom database manager for sandbox mode
        from database import DatabaseManager
        loader.db_manager = DatabaseManager(database_path)
    return loader.load_data_from_csv(file_path)


def get_data_loading_status() -> Dict[str, Any]:
    """
    Get data loading status.
    
    Returns:
        Dict[str, Any]: Loading status
    """
    loader = DataLoader()
    return loader.get_loading_status()
