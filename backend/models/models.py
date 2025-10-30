"""
Database models and schema definitions.
Contains SQLite table creation schemas matching the actual CSV data fields.
"""

from typing import List, Dict, Any
from .database import get_database_manager
from config import CSV_REQUIRED_COLUMNS
import logging

logger = logging.getLogger(__name__)


class DatabaseSchema:
    """Database schema definitions based on actual CSV structure."""
    
    @staticmethod
    def get_sales_table_schema() -> str:
        """
        Get the sales table schema based on actual CSV columns.
        
        Returns:
            str: SQL CREATE TABLE statement
        """
        return """
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            invoice_id TEXT NOT NULL,
            medicine_name TEXT NOT NULL,
            generic_name TEXT,
            brand TEXT,
            manufacturer TEXT,
            supplier TEXT,
            dosage_form TEXT,
            strength TEXT,
            category TEXT,
            prescription_required INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_sales REAL GENERATED ALWAYS AS (quantity * unit_price) STORED,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    
    @staticmethod
    def get_medicine_master_schema() -> str:
        """
        Get the medicine master table schema.
        
        Returns:
            str: SQL CREATE TABLE statement
        """
        return """
        CREATE TABLE IF NOT EXISTS medicine_master (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine_name TEXT UNIQUE NOT NULL,
            generic_names TEXT,
            primary_category TEXT,
            primary_dosage_form TEXT,
            primary_strength TEXT,
            primary_manufacturer TEXT,
            total_quantity_sold INTEGER DEFAULT 0,
            total_revenue_INR REAL DEFAULT 0.0,
            avg_unit_price_INR REAL DEFAULT 0.0,
            unique_orders INTEGER DEFAULT 0,
            rank INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    
    @staticmethod
    def get_seasonal_analysis_schema() -> str:
        """
        Get the seasonal analysis table schema.
        
        Returns:
            str: SQL CREATE TABLE statement
        """
        return """
        CREATE TABLE IF NOT EXISTS seasonal_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            season TEXT NOT NULL,
            medicine_name TEXT NOT NULL,
            total_quantity INTEGER NOT NULL,
            total_revenue REAL NOT NULL,
            unique_orders INTEGER NOT NULL,
            avg_daily_sales REAL NOT NULL,
            suggested_stock_quantity INTEGER NOT NULL,
            is_fast_mover BOOLEAN DEFAULT FALSE,
            priority_level TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(season, medicine_name)
        )
        """
    
    @staticmethod
    def get_recommendations_schema() -> str:
        """
        Get the recommendations table schema.
        
        Returns:
            str: SQL CREATE TABLE statement
        """
        return """
        CREATE TABLE IF NOT EXISTS recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            season TEXT NOT NULL,
            medicine_name TEXT NOT NULL,
            rank INTEGER NOT NULL,
            last_season_sales INTEGER NOT NULL,
            suggested_stock_quantity INTEGER NOT NULL,
            daily_avg_sales REAL NOT NULL,
            total_revenue REAL NOT NULL,
            avg_unit_price REAL NOT NULL,
            unique_orders INTEGER NOT NULL,
            is_fast_mover BOOLEAN DEFAULT FALSE,
            priority_level TEXT,
            action TEXT,
            stock_duration_days INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(season, medicine_name)
        )
        """
    
    @staticmethod
    def get_forecasts_schema() -> str:
        """
        Get the forecasts table schema.
        
        Returns:
            str: SQL CREATE TABLE statement
        """
        return """
        CREATE TABLE IF NOT EXISTS forecasts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine_name TEXT NOT NULL,
            forecast_type TEXT NOT NULL,  -- 'SARIMA' or 'Prophet'
            forecast_date TEXT NOT NULL,
            predicted_quantity INTEGER NOT NULL,
            lower_bound INTEGER,
            upper_bound INTEGER,
            confidence_level REAL DEFAULT 0.95,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    
    @staticmethod
    def get_indexes() -> List[str]:
        """
        Get database indexes for performance optimization.
        
        Returns:
            List[str]: List of CREATE INDEX statements
        """
        return [
            "CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date)",
            "CREATE INDEX IF NOT EXISTS idx_sales_medicine ON sales(medicine_name)",
            "CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_id)",
            "CREATE INDEX IF NOT EXISTS idx_sales_category ON sales(category)",
            "CREATE INDEX IF NOT EXISTS idx_medicine_master_name ON medicine_master(medicine_name)",
            "CREATE INDEX IF NOT EXISTS idx_medicine_master_rank ON medicine_master(rank)",
            "CREATE INDEX IF NOT EXISTS idx_seasonal_analysis_season ON seasonal_analysis(season)",
            "CREATE INDEX IF NOT EXISTS idx_seasonal_analysis_medicine ON seasonal_analysis(medicine_name)",
            "CREATE INDEX IF NOT EXISTS idx_recommendations_season ON recommendations(season)",
            "CREATE INDEX IF NOT EXISTS idx_recommendations_rank ON recommendations(rank)",
            "CREATE INDEX IF NOT EXISTS idx_forecasts_medicine ON forecasts(medicine_name)",
            "CREATE INDEX IF NOT EXISTS idx_forecasts_date ON forecasts(forecast_date)"
        ]
    
    @staticmethod
    def get_all_schemas() -> List[str]:
        """
        Get all table creation schemas.
        
        Returns:
            List[str]: List of CREATE TABLE statements
        """
        return [
            DatabaseSchema.get_sales_table_schema(),
            DatabaseSchema.get_medicine_master_schema(),
            DatabaseSchema.get_seasonal_analysis_schema(),
            DatabaseSchema.get_recommendations_schema(),
            DatabaseSchema.get_forecasts_schema()
        ]


class DatabaseInitializer:
    """Handles database initialization and schema creation."""
    
    def __init__(self):
        self.db_manager = get_database_manager()
        self.schema = DatabaseSchema()
    
    def initialize_database(self) -> bool:
        """
        Initialize the database with all required tables and indexes.
        
        Returns:
            bool: True if initialization successful, False otherwise
        """
        try:
            logger.info("Starting database initialization...")
            
            # Create all tables
            for schema in self.schema.get_all_schemas():
                success = self.db_manager.execute_script(schema)
                if not success:
                    logger.error(f"Failed to create table with schema: {schema[:100]}...")
                    return False
            
            # Create indexes
            for index_sql in self.schema.get_indexes():
                success = self.db_manager.execute_script(index_sql)
                if not success:
                    logger.error(f"Failed to create index: {index_sql}")
                    return False
            
            logger.info("Database initialization completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            return False
    
    def check_schema_exists(self) -> bool:
        """
        Check if all required tables exist.
        
        Returns:
            bool: True if all tables exist, False otherwise
        """
        try:
            required_tables = ['sales', 'medicine_master', 'seasonal_analysis', 'recommendations', 'forecasts']
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name NOT LIKE 'sqlite_%'
                """)
                existing_tables = [row[0] for row in cursor.fetchall()]
                
                missing_tables = set(required_tables) - set(existing_tables)
                if missing_tables:
                    logger.warning(f"Missing tables: {missing_tables}")
                    return False
                
                logger.info("All required tables exist")
                return True
                
        except Exception as e:
            logger.error(f"Error checking schema: {e}")
            return False
    
    def get_table_info(self) -> Dict[str, Any]:
        """
        Get information about all tables.
        
        Returns:
            Dict[str, Any]: Table information
        """
        try:
            table_info = {}
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get all tables
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name NOT LIKE 'sqlite_%'
                    ORDER BY name
                """)
                tables = [row[0] for row in cursor.fetchall()]
                
                for table in tables:
                    # Get row count
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    row_count = cursor.fetchone()[0]
                    
                    # Get column info
                    cursor.execute(f"PRAGMA table_info({table})")
                    columns = cursor.fetchall()
                    
                    table_info[table] = {
                        'row_count': row_count,
                        'columns': [{'name': col[1], 'type': col[2], 'not_null': col[3]} for col in columns]
                    }
            
            return table_info
            
        except Exception as e:
            logger.error(f"Error getting table info: {e}")
            return {}


def initialize_database_schema() -> bool:
    """
    Initialize the database schema.
    
    Returns:
        bool: True if successful, False otherwise
    """
    initializer = DatabaseInitializer()
    return initializer.initialize_database()


def get_database_schema_info() -> Dict[str, Any]:
    """
    Get comprehensive database schema information.
    
    Returns:
        Dict[str, Any]: Schema information
    """
    initializer = DatabaseInitializer()
    return {
        'schema_exists': initializer.check_schema_exists(),
        'table_info': initializer.get_table_info(),
        'required_columns': CSV_REQUIRED_COLUMNS
    }
