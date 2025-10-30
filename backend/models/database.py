"""
Database connection and management module.
Handles SQLite connection creation, initialization, and closure.
"""

import sqlite3
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from contextlib import contextmanager

from config import DB_CONFIG, DATABASE_DIR

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages SQLite database connections and operations."""
    
    def __init__(self, database_path: str = None):
        """
        Initialize database manager.
        
        Args:
            database_path (str): Path to SQLite database file
        """
        self.database_path = database_path or DB_CONFIG['database_path']
        self._ensure_database_directory()
    
    def _ensure_database_directory(self):
        """Ensure database directory exists."""
        DATABASE_DIR.mkdir(exist_ok=True)
        logger.info(f"Database directory ensured: {DATABASE_DIR}")
    
    @contextmanager
    def get_connection(self):
        """
        Context manager for database connections.
        
        Yields:
            sqlite3.Connection: Database connection
        """
        conn = None
        try:
            conn = sqlite3.connect(
                self.database_path,
                timeout=DB_CONFIG['timeout'],
                check_same_thread=DB_CONFIG['check_same_thread']
            )
            conn.row_factory = sqlite3.Row  # Enable column access by name
            logger.info(f"Database connection established: {self.database_path}")
            yield conn
        except sqlite3.Error as e:
            logger.error(f"Database connection error: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()
                logger.info("Database connection closed")
    
    def test_connection(self) -> bool:
        """
        Test database connection.
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                logger.info("Database connection test successful")
                return result[0] == 1
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False
    
    def get_database_info(self) -> Dict[str, Any]:
        """
        Get database information.
        
        Returns:
            Dict[str, Any]: Database information
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get database file info
                db_path = Path(self.database_path)
                file_size = db_path.stat().st_size if db_path.exists() else 0
                
                # Get table count
                cursor.execute("""
                    SELECT COUNT(*) as table_count 
                    FROM sqlite_master 
                    WHERE type='table' AND name NOT LIKE 'sqlite_%'
                """)
                table_count = cursor.fetchone()[0]
                
                # Get table names
                cursor.execute("""
                    SELECT name 
                    FROM sqlite_master 
                    WHERE type='table' AND name NOT LIKE 'sqlite_%'
                    ORDER BY name
                """)
                tables = [row[0] for row in cursor.fetchall()]
                
                return {
                    'database_path': self.database_path,
                    'file_size_bytes': file_size,
                    'file_size_mb': round(file_size / (1024 * 1024), 2),
                    'table_count': table_count,
                    'tables': tables,
                    'exists': db_path.exists()
                }
        except Exception as e:
            logger.error(f"Error getting database info: {e}")
            return {
                'database_path': self.database_path,
                'file_size_bytes': 0,
                'file_size_mb': 0,
                'table_count': 0,
                'tables': [],
                'exists': False,
                'error': str(e)
            }
    
    def execute_query(self, query: str, params: tuple = ()) -> list:
        """
        Execute a SELECT query and return results.
        
        Args:
            query (str): SQL query
            params (tuple): Query parameters
            
        Returns:
            list: Query results
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, params)
                results = cursor.fetchall()
                logger.info(f"Query executed successfully: {len(results)} rows returned")
                return results
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            raise
    
    def execute_script(self, script: str) -> bool:
        """
        Execute a SQL script.
        
        Args:
            script (str): SQL script
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.executescript(script)
                conn.commit()
                logger.info("SQL script executed successfully")
                return True
        except Exception as e:
            logger.error(f"SQL script execution failed: {e}")
            return False
    
    def backup_database(self, backup_path: str = None) -> bool:
        """
        Create a backup of the database.
        
        Args:
            backup_path (str): Path for backup file
            
        Returns:
            bool: True if backup successful, False otherwise
        """
        try:
            import shutil
            from datetime import datetime
            
            if not backup_path:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_path = str(DATABASE_DIR / f"pharmacy_backup_{timestamp}.db")
            
            shutil.copy2(self.database_path, backup_path)
            logger.info(f"Database backup created: {backup_path}")
            return True
        except Exception as e:
            logger.error(f"Database backup failed: {e}")
            return False


# Global database manager instance
db_manager = DatabaseManager()


def get_database_manager() -> DatabaseManager:
    """
    Get the global database manager instance.
    
    Returns:
        DatabaseManager: Database manager instance
    """
    return db_manager


def init_database() -> bool:
    """
    Initialize database connection and test.
    
    Returns:
        bool: True if initialization successful, False otherwise
    """
    try:
        manager = get_database_manager()
        if manager.test_connection():
            logger.info("Database initialization successful")
            return True
        else:
            logger.error("Database initialization failed")
            return False
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        return False


def get_database_status() -> Dict[str, Any]:
    """
    Get comprehensive database status.
    
    Returns:
        Dict[str, Any]: Database status information
    """
    manager = get_database_manager()
    info = manager.get_database_info()
    info['connection_test'] = manager.test_connection()
    return info
