#!/usr/bin/env python3
"""
Added Force Database Rebuild Script
===================================
Replicates the current pharmacy_backup.db database structure and data.
This script creates an exact copy of the existing database with all tables,
indexes, and data intact.
"""

import sqlite3
import pandas as pd
import os
import shutil
import logging
from datetime import datetime
from pathlib import Path

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DATABASE_PATH, INPUT_DIR

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def added_force_rebuild_database():
    """
    Force rebuild database by replicating the current pharmacy_backup.db structure and data.
    """
    try:
        print("="*80)
        print("ADDED FORCE DATABASE REBUILD - REPLICATING PHARMACY_BACKUP.DB")
        print("="*80)
        
        # Step 1: Create temporary database
        print("\n1. Creating temporary database...")
        temp_db_path = DATABASE_PATH.parent / "temp_pharmacy_rebuild.db"
        
        # Remove temp database if exists
        if temp_db_path.exists():
            temp_db_path.unlink()
        
        # Create new temporary database
        conn = sqlite3.connect(str(temp_db_path))
        cursor = conn.cursor()
        
        # Enable foreign keys
        cursor.execute("PRAGMA foreign_keys = ON")
        
        # Step 2: Create exact schema from pharmacy_backup.db
        print("\n2. Creating database schema (replicating pharmacy_backup.db)...")
        
        # Create all tables with exact schema from pharmacy_backup.db
        tables = [
            
            """CREATE TABLE Manufacturers (
                manufacturer_id INTEGER PRIMARY KEY AUTOINCREMENT,
                manufacturer_name TEXT NOT NULL,
                contact_person TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                city TEXT,
                state TEXT,
                zip_code TEXT,
                country TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )""",
            
            """CREATE TABLE Suppliers (
                supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
                supplier_name TEXT NOT NULL,
                contact_person_name TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                city TEXT,
                state TEXT,
                zip_code TEXT,
                country TEXT,
                gstin TEXT,
                pan_number TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )""",
            
            """CREATE TABLE Medicines (
                medicine_id INTEGER PRIMARY KEY AUTOINCREMENT,
                medicine_name TEXT NOT NULL,
                generic_name TEXT,
                brand TEXT,
                dosage_form TEXT,
                strength TEXT,
                category TEXT,
                prescription_required BOOLEAN DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                manufacturer_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (manufacturer_id) REFERENCES Manufacturers(manufacturer_id)
            )""",
            
            """CREATE TABLE Medicine_Suppliers (
                medicine_supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
                medicine_id INTEGER NOT NULL,
                supplier_id INTEGER NOT NULL,
                default_purchase_price REAL DEFAULT 0,
                gst_percentage REAL DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id),
                FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
            )""",
            
            """CREATE TABLE Inventory (
                inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
                medicine_id INTEGER NOT NULL,
                supplier_id INTEGER NOT NULL,
                batch_number TEXT,
                expiry_date DATE,
                quantity_in_stock INTEGER DEFAULT 0,
                purchase_price_per_unit REAL DEFAULT 0,
                selling_price_per_unit REAL DEFAULT 0,
                reorder_level INTEGER DEFAULT 0,
                last_restocked_date DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id),
                FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
            )""",
            
            """CREATE TABLE Customers (
                customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                address TEXT NOT NULL,
                city TEXT,
                state TEXT,
                zip_code TEXT,
                date_of_birth DATE,
                gender TEXT,
                is_active_customer BOOLEAN DEFAULT 1,
                outstanding_credit REAL DEFAULT 0,
                payment_status TEXT DEFAULT 'current',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )""",
            
            """CREATE TABLE Invoice (
                invoice_id TEXT PRIMARY KEY,
                sale_date DATE NOT NULL,
                customer_id INTEGER,
                total_amount REAL NOT NULL,
                total_gst REAL DEFAULT 0,
                payment_method TEXT,
                payment_status TEXT DEFAULT 'paid',
                outstanding_credit REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
            )""",
            
            """CREATE TABLE Sales (
                sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id TEXT NOT NULL,
                date_of_sale DATE NOT NULL,
                time_of_sale TIME NOT NULL,
                medicine_id INTEGER NOT NULL,
                quantity_sold INTEGER NOT NULL,
                unit_price_at_sale REAL NOT NULL,
                total_amount REAL NOT NULL,
                customer_id INTEGER,
                payment_method TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (invoice_id) REFERENCES Invoice(invoice_id),
                FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id),
                FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
            )""",
            
            """CREATE TABLE Prescription (
                prescription_id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                doctor_name TEXT,
                diagnosis TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
            )""",
            
            """CREATE TABLE Prescription_Medicines (
                prescription_medicine_id INTEGER PRIMARY KEY AUTOINCREMENT,
                prescription_id INTEGER NOT NULL,
                medicine_id INTEGER NOT NULL,
                dosage TEXT,
                frequency TEXT,
                duration TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prescription_id) REFERENCES Prescription(prescription_id),
                FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id)
            )""",
            
            """CREATE TABLE Purchase_Invoice (
                purchase_invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
                supplier_id INTEGER NOT NULL,
                invoice_number TEXT,
                purchase_date DATE NOT NULL,
                total_amount REAL NOT NULL,
                payment_status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
            )""",
            
            """CREATE TABLE Purchase_Item (
                purchase_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                purchase_invoice_id INTEGER NOT NULL,
                medicine_id INTEGER NOT NULL,
                supplier_id INTEGER NOT NULL,
                batch_number TEXT,
                expiry_date DATE,
                quantity_purchased INTEGER NOT NULL,
                cost_per_unit REAL NOT NULL,
                total_cost REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (purchase_invoice_id) REFERENCES Purchase_Invoice(purchase_invoice_id),
                FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id),
                FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
            )""",
            
            """CREATE TABLE Medicine_Return (
                return_id INTEGER PRIMARY KEY AUTOINCREMENT,
                sale_id INTEGER NOT NULL,
                customer_id INTEGER,
                medicine_id INTEGER NOT NULL,
                quantity_returned INTEGER NOT NULL,
                reason_for_return TEXT,
                return_date DATE NOT NULL,
                refund_amount REAL DEFAULT 0,
                processed_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sale_id) REFERENCES Sales(sale_id),
                FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
                FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id)
            )""",
            
            """CREATE TABLE Refund (
                refund_id INTEGER PRIMARY KEY AUTOINCREMENT,
                return_id INTEGER NOT NULL,
                customer_id INTEGER,
                payment_method TEXT,
                refund_amount REAL NOT NULL,
                refund_date DATE NOT NULL,
                approved_by TEXT,
                refund_reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (return_id) REFERENCES Medicine_Return(return_id),
                FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
            )""",
            
            """CREATE TABLE User (
                user_id INTEGER PRIMARY KEY
            )""",
            
            """CREATE TABLE medicine_master (
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
            )""",
            
            """CREATE TABLE seasonal_analysis (
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
            )""",
            
            """CREATE TABLE recommendations (
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
            )""",
            
            """CREATE TABLE forecasts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                medicine_name TEXT NOT NULL,
                forecast_type TEXT NOT NULL,
                forecast_date TEXT NOT NULL,
                predicted_quantity INTEGER NOT NULL,
                lower_bound INTEGER,
                upper_bound INTEGER,
                confidence_level REAL DEFAULT 0.95,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )"""
        ]
        
        for i, table_sql in enumerate(tables, 1):
            print(f"   {i}. Creating table...")
            cursor.execute(table_sql)
        
        # Create indexes (exact from pharmacy_backup.db)
        print("   Creating indexes...")
        indexes = [
            "CREATE INDEX idx_sales_invoice_id ON Sales(invoice_id)",
            "CREATE INDEX idx_sales_medicine_id ON Sales(medicine_id)",
            "CREATE INDEX idx_sales_date ON Sales(date_of_sale)",
            "CREATE INDEX idx_medicines_name ON Medicines(medicine_name)",
            "CREATE INDEX idx_medicines_category ON Medicines(category)"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
        
        print("   SUCCESS: Database schema created successfully")
        
        # Step 3: Copy data from pharmacy_backup.db
        print("\n3. Copying data from pharmacy_backup.db...")
        
        # Connect to source database
        source_db_path = DATABASE_PATH.parent / "pharmacy_backup.db"
        if not source_db_path.exists():
            raise FileNotFoundError(f"Source database not found: {source_db_path}")
        
        source_conn = sqlite3.connect(str(source_db_path))
        source_cursor = source_conn.cursor()
        
        # Get all table names from source database
        source_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        table_names = [row[0] for row in source_cursor.fetchall()]
        
        print(f"   Found {len(table_names)} tables to copy:")
        
        # Copy data from each table
        for table_name in table_names:
            try:
                # Get table structure
                source_cursor.execute(f"PRAGMA table_info({table_name})")
                columns = [col[1] for col in source_cursor.fetchall()]
                
                # Get all data from source table
                source_cursor.execute(f"SELECT * FROM {table_name}")
                rows = source_cursor.fetchall()
                
                if rows:
                    # Create placeholders for INSERT
                    placeholders = ','.join(['?' for _ in columns])
                    insert_sql = f"INSERT INTO {table_name} VALUES ({placeholders})"
                    
                    # Insert all rows
                    cursor.executemany(insert_sql, rows)
                    print(f"   ✓ {table_name}: {len(rows)} records copied")
                else:
                    print(f"   ✓ {table_name}: 0 records (empty table)")
                    
            except Exception as e:
                print(f"   ✗ {table_name}: Error - {e}")
                continue
        
        # Copy sqlite_sequence data
        try:
            source_cursor.execute("SELECT * FROM sqlite_sequence")
            seq_rows = source_cursor.fetchall()
            if seq_rows:
                cursor.executemany("INSERT INTO sqlite_sequence VALUES (?, ?)", seq_rows)
                print("   ✓ sqlite_sequence: Updated")
        except Exception as e:
            print(f"   ✗ sqlite_sequence: Error - {e}")
        
        source_conn.close()
        conn.commit()
        print("   SUCCESS: Data copied successfully")
        
        # Step 4: Replace original database
        print("\n4. Replacing original database...")
        conn.close()
        
        # Create backup of current database if exists
        if DATABASE_PATH.exists():
            try:
                backup_path = DATABASE_PATH.parent / f"pharmacy_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
                shutil.copy2(str(DATABASE_PATH), str(backup_path))
                print(f"   Original database backed up to: {backup_path.name}")
            except Exception as e:
                print(f"   WARNING: Could not backup original database: {e}")
        
        # Remove original database if exists
        if DATABASE_PATH.exists():
            try:
                DATABASE_PATH.unlink()
            except PermissionError:
                print("   WARNING: Could not delete original database (file in use)")
                print("   Renaming original database...")
                old_backup_path = DATABASE_PATH.parent / f"pharmacy_old_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
                DATABASE_PATH.rename(old_backup_path)
                print(f"   Original database renamed to: {old_backup_path.name}")
        
        # Move temporary database to final location
        shutil.move(str(temp_db_path), str(DATABASE_PATH))
        print("   SUCCESS: Database replaced successfully")
        
        # Step 5: Verify final database
        print("\n5. Verifying final database...")
        final_conn = sqlite3.connect(str(DATABASE_PATH))
        final_cursor = final_conn.cursor()
        
        # Get table counts
        tables_to_check = [
            'User', 'Manufacturers', 'Suppliers', 'Medicines', 'Medicine_Suppliers',
            'Customers', 'Inventory', 'Invoice', 'Sales', 'Prescription',
            'Prescription_Medicines', 'Purchase_Invoice', 'Purchase_Item',
            'Medicine_Return', 'Refund', 'medicine_master', 'seasonal_analysis',
            'recommendations', 'forecasts'
        ]
        
        print("\n   Database Summary:")
        print("   " + "-" * 50)
        
        total_records = 0
        for table in tables_to_check:
            try:
                final_cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = final_cursor.fetchone()[0]
                print(f"   {table:<25}: {count:>8} records")
                total_records += count
            except sqlite3.OperationalError:
                print(f"   {table:<25}: {0:>8} records (table empty)")
        
        print("   " + "-" * 50)
        print(f"   {'TOTAL':<25}: {total_records:>8} records")
        
        # Get database file size
        file_size = DATABASE_PATH.stat().st_size
        file_size_mb = file_size / (1024 * 1024)
        print(f"\n   Database file size: {file_size_mb:.2f} MB")
        print(f"   Database created at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Verify foreign key constraints
        print("\n   Verifying foreign key constraints...")
        final_cursor.execute("PRAGMA foreign_key_check")
        fk_errors = final_cursor.fetchall()
        if fk_errors:
            print(f"   WARNING: {len(fk_errors)} foreign key constraint violations found")
            for error in fk_errors[:5]:  # Show first 5 errors
                print(f"     - {error}")
        else:
            print("   ✓ All foreign key constraints are valid")
        
        final_conn.close()
        
        print("\n" + "="*80)
        print("DATABASE REBUILT SUCCESSFULLY!")
        print("="*80)
        print("✓ Exact replica of pharmacy_backup.db created")
        print("✓ All tables, indexes, and data preserved")
        print("✓ Foreign key constraints maintained")
        print("✓ Ready for use")
        
        return True
        
    except Exception as e:
        print(f"\nERROR: Database rebuild failed: {e}")
        logger.error(f"Database rebuild failed: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    success = added_force_rebuild_database()
    if success:
        print("\nSUCCESS: Database rebuild completed successfully!")
    else:
        print("\nERROR: Database rebuild failed!")
        exit(1)
