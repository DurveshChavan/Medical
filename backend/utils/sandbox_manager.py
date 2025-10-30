"""
Sandbox database management module.
Handles temporary database creation, switching, and restoration for sandbox mode.
"""

import sqlite3
import shutil
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from contextlib import contextmanager

from config import DATABASE_DIR, DB_CONFIG
from models.database import DatabaseManager
from utils.data_loader import load_csv_data

# Configure logging
logger = logging.getLogger(__name__)

class SandboxManager:
    """Manages sandbox database operations for temporary data analysis."""
    
    def __init__(self):
        """Initialize sandbox manager."""
        self.main_db_path = DATABASE_DIR / "pharmacy_backup.db"
        self.temp_db_path = DATABASE_DIR / "pharmacy_temp.db"
        self.backup_db_path = DATABASE_DIR / "pharmacy_backup.db"
        self.is_sandbox_mode = False
        self.current_upload_file = None
    
    def create_temp_database(self) -> bool:
        """
        Create a temporary database for sandbox mode.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Create empty temporary database
            temp_conn = sqlite3.connect(str(self.temp_db_path))
            temp_conn.close()
            
            logger.info("Temporary database created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create temporary database: {e}")
            return False
    
    def backup_main_database(self) -> bool:
        """
        Create a backup of the main database.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if self.main_db_path.exists():
                shutil.copy2(self.main_db_path, self.backup_db_path)
                logger.info("Main database backed up successfully")
                return True
            else:
                logger.warning("Main database does not exist, no backup needed")
                return True
                
        except Exception as e:
            logger.error(f"Failed to backup main database: {e}")
            return False
    
    def restore_main_database(self) -> bool:
        """
        Restore the main database from backup.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if self.backup_db_path.exists():
                shutil.copy2(self.backup_db_path, self.main_db_path)
                logger.info("Main database restored successfully")
                return True
            else:
                logger.warning("No backup database found to restore")
                return True
                
        except Exception as e:
            logger.error(f"Failed to restore main database: {e}")
            return False
    
    def switch_to_sandbox_mode(self, csv_file_path: str) -> bool:
        """
        Switch to sandbox mode with uploaded CSV data.
        
        Args:
            csv_file_path (str): Path to uploaded CSV file
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Create temporary database
            if not self.create_temp_database():
                return False
            
            # Initialize database schema in temporary database
            from models import initialize_database_schema
            initialize_database_schema(str(self.temp_db_path))
            
            # Load CSV data into temporary database
            load_result = load_csv_data(csv_file_path, str(self.temp_db_path))
            if not load_result.get('success', False):
                logger.error(f"Failed to load CSV data: {load_result}")
                return False
            
            # Switch database path to temporary database
            self.is_sandbox_mode = True
            self.current_upload_file = csv_file_path
            
            logger.info("Switched to sandbox mode successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to switch to sandbox mode: {e}")
            return False
    
    def exit_sandbox_mode(self) -> bool:
        """
        Exit sandbox mode and restore main database.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Restore main database
            if not self.restore_main_database():
                return False
            
            # Clean up temporary files
            if self.temp_db_path.exists():
                self.temp_db_path.unlink()
            
            if self.backup_db_path.exists():
                self.backup_db_path.unlink()
            
            # Reset state
            self.is_sandbox_mode = False
            self.current_upload_file = None
            
            logger.info("Exited sandbox mode successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to exit sandbox mode: {e}")
            return False
    
    def get_current_database_path(self) -> str:
        """
        Get the current database path (main or temp).
        
        Returns:
            str: Path to current database
        """
        if self.is_sandbox_mode:
            return str(self.temp_db_path)
        else:
            return str(self.main_db_path)
    
    def get_sandbox_status(self) -> Dict[str, Any]:
        """
        Get current sandbox status.
        
        Returns:
            Dict[str, Any]: Sandbox status information
        """
        return {
            'is_sandbox_mode': self.is_sandbox_mode,
            'current_upload_file': self.current_upload_file,
            'main_db_exists': self.main_db_path.exists(),
            'temp_db_exists': self.temp_db_path.exists(),
            'backup_db_exists': self.backup_db_path.exists()
        }
    
    def cleanup_temp_files(self):
        """Clean up temporary files."""
        try:
            if self.temp_db_path.exists():
                self.temp_db_path.unlink()
            if self.backup_db_path.exists():
                self.backup_db_path.unlink()
            logger.info("Temporary files cleaned up")
        except Exception as e:
            logger.error(f"Failed to cleanup temporary files: {e}")

# Global sandbox manager instance
sandbox_manager = SandboxManager()

