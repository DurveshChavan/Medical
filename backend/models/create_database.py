#!/usr/bin/env python3
"""
Database Creation Script for Seasonal Medicine Recommendation System
================================================================
Creates the SQLite database with all normalized tables as per the schema.
Uses Python's built-in sqlite3 library (no external ORM required).
"""

import sqlite3
import os
from pathlib import Path
from datetime import datetime

def create_database():
    """Create the SQLite database with all normalized tables."""
    
    print("="*80)
    print("SEASONAL MEDICINE RECOMMENDATION SYSTEM")
    print("Database Creation Script")
    print("="*80)
    
    # Get project root directory
    project_root = Path(__file__).parent.parent
    database_dir = project_root / "database"
    database_path = database_dir / "pharmacy_backup.db"
    
    # Create database directory if it doesn't exist
    database_dir.mkdir(exist_ok=True)
    print(f"Database directory: {database_dir}")
    print(f"Database file: {database_path}")
    
    # Connect to SQLite database (creates if not exists)
    conn = sqlite3.connect(str(database_path))
    cursor = conn.cursor()
    
    print("\nCreating database tables...")
    print("-" * 80)
    
    # Enable foreign key constraints
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # 1. Sales table (main transaction data)
    print("1. Creating Sales table...")
    cursor.execute("""
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 2. Medicine Master table (aggregated medicine data)
    print("2. Creating Medicine Master table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS medicine_master (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine_name TEXT NOT NULL UNIQUE,
            generic_names TEXT,
            primary_category TEXT,
            primary_dosage_form TEXT,
            primary_strength TEXT,
            primary_manufacturer TEXT,
            total_quantity_sold INTEGER DEFAULT 0,
            total_revenue_INR REAL DEFAULT 0.0,
            avg_unit_price_INR REAL DEFAULT 0.0,
            unique_orders INTEGER DEFAULT 0,
            rank INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 3. Seasonal Analysis table (seasonal patterns)
    print("3. Creating Seasonal Analysis table...")
    cursor.execute("""
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 4. Recommendations table (stock recommendations)
    print("4. Creating Recommendations table...")
    cursor.execute("""
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 5. Forecasts table (time series predictions)
    print("5. Creating Forecasts table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS forecasts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine_name TEXT NOT NULL,
            forecast_type TEXT NOT NULL,
            forecast_date TEXT NOT NULL,
            predicted_quantity INTEGER NOT NULL,
            lower_bound INTEGER,
            upper_bound INTEGER,
            confidence_level REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 6. Manufacturers table (manufacturer information)
    print("6. Creating Manufacturers table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS manufacturers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            manufacturer_name TEXT NOT NULL UNIQUE,
            contact_info TEXT,
            supplier_rating REAL DEFAULT 0.0,
            total_medicines INTEGER DEFAULT 0,
            total_revenue REAL DEFAULT 0.0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 7. Categories table (medicine categories)
    print("7. Creating Categories table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_name TEXT NOT NULL UNIQUE,
            description TEXT,
            total_medicines INTEGER DEFAULT 0,
            total_revenue REAL DEFAULT 0.0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 8. Suppliers table (supplier information)
    print("8. Creating Suppliers table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_name TEXT NOT NULL UNIQUE,
            contact_info TEXT,
            rating REAL DEFAULT 0.0,
            total_medicines INTEGER DEFAULT 0,
            total_revenue REAL DEFAULT 0.0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create indexes for better performance
    print("\nCreating database indexes...")
    print("-" * 80)
    
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date)",
        "CREATE INDEX IF NOT EXISTS idx_sales_medicine ON sales(medicine_name)",
        "CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_id)",
        "CREATE INDEX IF NOT EXISTS idx_seasonal_analysis_season ON seasonal_analysis(season)",
        "CREATE INDEX IF NOT EXISTS idx_seasonal_analysis_medicine ON seasonal_analysis(medicine_name)",
        "CREATE INDEX IF NOT EXISTS idx_recommendations_season ON recommendations(season)",
        "CREATE INDEX IF NOT EXISTS idx_recommendations_rank ON recommendations(rank)",
        "CREATE INDEX IF NOT EXISTS idx_forecasts_medicine ON forecasts(medicine_name)",
        "CREATE INDEX IF NOT EXISTS idx_forecasts_type ON forecasts(forecast_type)"
    ]
    
    for i, index_sql in enumerate(indexes, 1):
        print(f"{i}. Creating index...")
        cursor.execute(index_sql)
    
    # Create triggers for auto-updating timestamps
    print("\nCreating update triggers...")
    print("-" * 80)
    
    triggers = [
        """
        CREATE TRIGGER IF NOT EXISTS update_sales_timestamp 
        AFTER UPDATE ON sales
        BEGIN
            UPDATE sales SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
        """,
        """
        CREATE TRIGGER IF NOT EXISTS update_medicine_master_timestamp 
        AFTER UPDATE ON medicine_master
        BEGIN
            UPDATE medicine_master SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
        """,
        """
        CREATE TRIGGER IF NOT EXISTS update_manufacturers_timestamp 
        AFTER UPDATE ON manufacturers
        BEGIN
            UPDATE manufacturers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
        """,
        """
        CREATE TRIGGER IF NOT EXISTS update_categories_timestamp 
        AFTER UPDATE ON categories
        BEGIN
            UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
        """,
        """
        CREATE TRIGGER IF NOT EXISTS update_suppliers_timestamp 
        AFTER UPDATE ON suppliers
        BEGIN
            UPDATE suppliers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
        """
    ]
    
    for i, trigger_sql in enumerate(triggers, 1):
        print(f"{i}. Creating trigger...")
        cursor.execute(trigger_sql)
    
    # Commit all changes
    conn.commit()
    
    # Verify table creation
    print("\nVerifying table creation...")
    print("-" * 80)
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    
    print(f"Tables created: {len(tables)}")
    for table in tables:
        print(f"  - {table[0]}")
    
    # Get database file size
    file_size = database_path.stat().st_size
    file_size_mb = file_size / (1024 * 1024)
    
    print(f"\nDatabase file size: {file_size_mb:.2f} MB")
    print(f"Database created at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Close connection
    conn.close()
    
    print("\n" + "="*80)
    print("All tables created successfully.")
    print("="*80)
    
    return True

if __name__ == "__main__":
    try:
        success = create_database()
        if success:
            print("\nSUCCESS: Database creation completed!")
        else:
            print("\nERROR: Database creation failed!")
            exit(1)
    except Exception as e:
        print(f"\nERROR: Database creation failed: {e}")
        exit(1)
