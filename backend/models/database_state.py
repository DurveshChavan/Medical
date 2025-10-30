"""
Global database state management.
Manages the currently active database path and provides centralized access.
"""

import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from threading import Lock

from config import DATABASE_DIR

# Configure logging
logger = logging.getLogger(__name__)

class DatabaseStateManager:
    """Manages the global database state and active database path."""
    
    def __init__(self):
        """Initialize database state manager."""
        self.main_db_path = DATABASE_DIR / "pharmacy_backup.db"
        self.temp_db_path = DATABASE_DIR / "temp_upload.db"
        self.backup_db_path = DATABASE_DIR / "pharmacy_backup.db"
        
        # Current active database path
        self._active_db_path = str(self.main_db_path)
        self._is_temp_mode = False
        self._current_upload_file = None
        
        # Thread safety
        self._lock = Lock()
    
    def get_active_database_path(self) -> str:
        """
        Get the currently active database path.
        
        Returns:
            str: Path to the active database
        """
        with self._lock:
            return self._active_db_path
    
    def is_using_temp_database(self) -> bool:
        """
        Check if currently using temporary database.
        
        Returns:
            bool: True if using temporary database
        """
        with self._lock:
            return self._is_temp_mode
    
    def get_current_upload_file(self) -> Optional[str]:
        """
        Get the current upload file name.
        
        Returns:
            Optional[str]: Current upload file name or None
        """
        with self._lock:
            return self._current_upload_file
    
    def switch_to_temp_database(self, csv_file_path: str) -> bool:
        """
        Switch to temporary database with uploaded CSV data.
        
        Args:
            csv_file_path (str): Path to uploaded CSV file
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            with self._lock:
                # Backup main database first
                if self.main_db_path.exists():
                    import shutil
                    shutil.copy2(self.main_db_path, self.backup_db_path)
                    logger.info("Main database backed up")
                
                # Create temporary database
                import sqlite3
                temp_conn = sqlite3.connect(str(self.temp_db_path))
                temp_conn.close()
                
                # Initialize schema in temporary database
                from models import initialize_database_schema
                initialize_database_schema(str(self.temp_db_path))
                
                # Load CSV data into temporary database
                from utils.data_loader import load_csv_data
                load_result = load_csv_data(csv_file_path, str(self.temp_db_path))
                
                if not load_result.get('success', False):
                    logger.error(f"Failed to load CSV data: {load_result}")
                    return False
                
                # Update state
                self._active_db_path = str(self.temp_db_path)
                self._is_temp_mode = True
                self._current_upload_file = Path(csv_file_path).name
                
                logger.info(f"Switched to temporary database: {self._active_db_path}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to switch to temporary database: {e}")
            return False
    
    def switch_to_main_database(self) -> bool:
        """
        Switch back to main database.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            with self._lock:
                # Restore main database from backup
                if self.backup_db_path.exists():
                    import shutil
                    shutil.copy2(self.backup_db_path, self.main_db_path)
                    logger.info("Main database restored from backup")
                
                # Clean up temporary files
                if self.temp_db_path.exists():
                    self.temp_db_path.unlink()
                
                if self.backup_db_path.exists():
                    self.backup_db_path.unlink()
                
                # Update state
                self._active_db_path = str(self.main_db_path)
                self._is_temp_mode = False
                self._current_upload_file = None
                
                logger.info(f"Switched to main database: {self._active_db_path}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to switch to main database: {e}")
            return False
    
    def get_database_status(self) -> Dict[str, Any]:
        """
        Get current database status.
        
        Returns:
            Dict[str, Any]: Database status information
        """
        with self._lock:
            return {
                'active_db_path': self._active_db_path,
                'is_temp_mode': self._is_temp_mode,
                'current_upload_file': self._current_upload_file,
                'main_db_exists': self.main_db_path.exists(),
                'temp_db_exists': self.temp_db_path.exists(),
                'backup_db_exists': self.backup_db_path.exists(),
                'is_using_main_db': self._active_db_path == str(self.main_db_path)
            }
    
    def reset_to_default(self) -> bool:
        """
        Reset to default main database.
        
        Returns:
            bool: True if successful, False otherwise
        """
        return self.switch_to_main_database()

# Global database state manager instance
db_state = DatabaseStateManager()
