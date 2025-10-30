"""
Create separate database for analysis tables (forecasts, recommendations, etc.)
"""

import sqlite3
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Analysis database path
ANALYSIS_DATABASE_PATH = Path("../database/analysis.db")

def create_analysis_database():
    """Create separate database for analysis tables."""
    try:
        # Ensure database directory exists
        ANALYSIS_DATABASE_PATH.parent.mkdir(exist_ok=True)
        
        # Connect to analysis database
        conn = sqlite3.connect(ANALYSIS_DATABASE_PATH)
        cursor = conn.cursor()
        
        # Create forecasts table
        cursor.execute("""
        CREATE TABLE forecasts (
            forecast_id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine_id INTEGER NOT NULL,
            season TEXT NOT NULL,
            predicted_quantity INTEGER NOT NULL,
            confidence_level DECIMAL(5,2),
            forecast_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Create recommendations table
        cursor.execute("""
        CREATE TABLE recommendations (
            recommendation_id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine_id INTEGER NOT NULL,
            season TEXT NOT NULL,
            recommended_quantity INTEGER NOT NULL,
            priority_level TEXT NOT NULL,
            reasoning TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Create seasonal_analysis table
        cursor.execute("""
        CREATE TABLE seasonal_analysis (
            analysis_id INTEGER PRIMARY KEY AUTOINCREMENT,
            season TEXT NOT NULL,
            total_quantity INTEGER NOT NULL,
            total_revenue DECIMAL(10,2) NOT NULL,
            unique_medicines INTEGER NOT NULL,
            analysis_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Create medicine_master table (if needed for analysis)
        cursor.execute("""
        CREATE TABLE medicine_master (
            master_id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine_name TEXT NOT NULL,
            generic_name TEXT,
            category TEXT,
            dosage_form TEXT,
            strength TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        conn.commit()
        conn.close()
        
        logger.info(f"Analysis database created successfully at: {ANALYSIS_DATABASE_PATH}")
        
    except Exception as e:
        logger.error(f"Error creating analysis database: {str(e)}")
        raise

if __name__ == "__main__":
    create_analysis_database()
