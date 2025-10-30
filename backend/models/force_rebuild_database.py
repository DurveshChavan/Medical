#!/usr/bin/env python3
"""
Force Database Rebuild Script
============================
Handles database file lock issues by using a temporary database approach.
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

def force_rebuild_database():
    """
    Force rebuild database by handling file lock issues.
    """
    try:
        print("="*80)
        print("FORCE DATABASE REBUILD")
        print("="*80)
        
        # Step 1: Create temporary database
        print("\n1. Creating temporary database...")
        temp_db_path = DATABASE_PATH.parent / "temp_pharmacy.db"
        
        # Remove temp database if exists
        if temp_db_path.exists():
            temp_db_path.unlink()
        
        # Create new temporary database
        conn = sqlite3.connect(str(temp_db_path))
        cursor = conn.cursor()
        
        # Enable foreign keys
        cursor.execute("PRAGMA foreign_keys = ON")
        
        # Step 2: Load CSV data
        print("\n2. Loading CSV data...")
        csv_files = list(INPUT_DIR.glob("*.csv"))
        if not csv_files:
            raise FileNotFoundError(f"No CSV files found in {INPUT_DIR}")
        
        latest_csv = max(csv_files, key=lambda f: f.stat().st_mtime)
        print(f"   Using CSV file: {latest_csv.name}")
        
        csv_data = pd.read_csv(latest_csv)
        print(f"   Loaded {len(csv_data)} records from CSV")
        
        # Step 3: Create schema in temporary database
        print("\n3. Creating database schema...")
        
        # Create all tables
        tables = [
            """CREATE TABLE User (
                user_id INTEGER PRIMARY KEY
            )""",
            
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
                country TEXT DEFAULT 'India',
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
                country TEXT DEFAULT 'India',
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
                default_purchase_price REAL,
                gst_percentage REAL DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id),
                FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id),
                UNIQUE(medicine_id, supplier_id)
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
            
            """CREATE TABLE Inventory (
                inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
                medicine_id INTEGER NOT NULL,
                supplier_id INTEGER NOT NULL,
                batch_number TEXT,
                expiry_date DATE,
                quantity_in_stock INTEGER DEFAULT 0,
                purchase_price_per_unit REAL,
                selling_price_per_unit REAL,
                reorder_level INTEGER DEFAULT 10,
                last_restocked_date DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id),
                FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
            )""",
            
            """CREATE TABLE Invoice (
                invoice_id TEXT PRIMARY KEY,
                sale_date DATE NOT NULL,
                customer_id INTEGER,
                total_amount REAL NOT NULL,
                total_gst REAL DEFAULT 0,
                payment_method TEXT DEFAULT 'cash',
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
                payment_method TEXT DEFAULT 'cash',
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
                refund_amount REAL,
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
            )"""
        ]
        
        for i, table_sql in enumerate(tables, 1):
            print(f"   {i}. Creating table...")
            cursor.execute(table_sql)
        
        # Create indexes
        print("   Creating indexes...")
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_sales_invoice_id ON sales(invoice_id)",
            "CREATE INDEX IF NOT EXISTS idx_sales_medicine_id ON sales(medicine_id)",
            "CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date_of_sale)",
            "CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(medicine_name)",
            "CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category)",
            "CREATE INDEX IF NOT EXISTS idx_invoice_date ON invoice(sale_date)",
            "CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)
        
        print("   SUCCESS: Database schema created successfully")
        
        # Step 4: Populate with real data
        print("\n4. Populating database with real data...")
        
        # Create manufacturers
        print("   Creating manufacturers...")
        manufacturers = csv_data['manufacturer'].dropna().unique()
        manufacturer_map = {}
        for i, manufacturer in enumerate(manufacturers, 1):
            cursor.execute("""
                INSERT INTO Manufacturers (manufacturer_id, manufacturer_name)
                VALUES (?, ?)
            """, (i, manufacturer))
            manufacturer_map[manufacturer] = i
        
        # Create suppliers
        print("   Creating suppliers...")
        suppliers = csv_data['supplier'].dropna().unique()
        supplier_map = {}
        for i, supplier in enumerate(suppliers, 1):
            cursor.execute("""
                INSERT INTO Suppliers (supplier_id, supplier_name)
                VALUES (?, ?)
            """, (i, supplier))
            supplier_map[supplier] = i
        
        # Create medicines
        print("   Creating medicines...")
        medicines = csv_data['medicine_name'].dropna().unique()
        medicine_map = {}
        for i, medicine in enumerate(medicines, 1):
            medicine_data = csv_data[csv_data['medicine_name'] == medicine].iloc[0]
            manufacturer_id = manufacturer_map.get(medicine_data['manufacturer'], None)
            
            cursor.execute("""
                INSERT INTO Medicines (
                    medicine_id, medicine_name, generic_name, brand, dosage_form,
                    strength, category, prescription_required, manufacturer_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                i, medicine, medicine_data['generic_name'], medicine_data['brand'],
                medicine_data['dosage_form'], medicine_data['strength'],
                medicine_data['category'], bool(medicine_data['prescription_required']),
                manufacturer_id
            ))
            medicine_map[medicine] = i
        
        # Create medicine-supplier mappings
        print("   Creating medicine-supplier mappings...")
        medicine_supplier_pairs = csv_data[['medicine_name', 'supplier']].drop_duplicates()
        for i, (_, row) in enumerate(medicine_supplier_pairs.iterrows(), 1):
            medicine_id = medicine_map.get(row['medicine_name'])
            supplier_id = supplier_map.get(row['supplier'])
            
            if medicine_id and supplier_id:
                cursor.execute("""
                    INSERT INTO Medicine_Suppliers (medicine_supplier_id, medicine_id, supplier_id)
                    VALUES (?, ?, ?)
                """, (i, medicine_id, supplier_id))
        
        # Create invoices
        print("   Creating invoices...")
        invoices = csv_data['invoice_id'].dropna().unique()
        for invoice_id in invoices:
            invoice_sales = csv_data[csv_data['invoice_id'] == invoice_id]
            total_amount = (invoice_sales['quantity'] * invoice_sales['unit_price']).sum()
            sale_date = invoice_sales['date'].iloc[0]
            
            cursor.execute("""
                INSERT INTO Invoice (invoice_id, sale_date, total_amount)
                VALUES (?, ?, ?)
            """, (invoice_id, sale_date, total_amount))
        
        # Create sales records
        print("   Creating sales records...")
        for i, (_, row) in enumerate(csv_data.iterrows(), 1):
            medicine_id = medicine_map.get(row['medicine_name'])
            invoice_id = row['invoice_id']
            total_amount = row['quantity'] * row['unit_price']
            
            cursor.execute("""
                INSERT INTO Sales (
                    sale_id, invoice_id, date_of_sale, time_of_sale, medicine_id,
                    quantity_sold, unit_price_at_sale, total_amount
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                i, invoice_id, row['date'], row['time'], medicine_id,
                row['quantity'], row['unit_price'], total_amount
            ))
        
        # Create default admin user
        print("   Creating default admin user...")
        cursor.execute("""
            INSERT INTO User (user_id)
            VALUES (1)
        """)
        
        conn.commit()
        print("   SUCCESS: Database populated successfully")
        
        # Step 5: Replace original database
        print("\n5. Replacing original database...")
        conn.close()
        
        # Remove original database if exists
        if DATABASE_PATH.exists():
            try:
                DATABASE_PATH.unlink()
            except PermissionError:
                print("   WARNING: Could not delete original database (file in use)")
                print("   Renaming original database...")
                backup_path = DATABASE_PATH.parent / f"pharmacy_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
                DATABASE_PATH.rename(backup_path)
                print(f"   Original database backed up to: {backup_path.name}")
        
        # Move temporary database to final location
        shutil.move(str(temp_db_path), str(DATABASE_PATH))
        print("   SUCCESS: Database replaced successfully")
        
        # Step 6: Verify final database
        print("\n6. Verifying final database...")
        final_conn = sqlite3.connect(str(DATABASE_PATH))
        final_cursor = final_conn.cursor()
        
        # Get table counts
        tables = [
            'User', 'Manufacturers', 'Suppliers', 'Medicines', 'Medicine_Suppliers',
            'Customers', 'Inventory', 'Invoice', 'Sales', 'Prescription',
            'Prescription_Medicines', 'Purchase_Invoice', 'Purchase_Item',
            'Medicine_Return', 'Refund'
        ]
        
        print("\n   Database Summary:")
        print("   " + "-" * 50)
        
        total_records = 0
        for table in tables:
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
        
        final_conn.close()
        
        print("\n" + "="*80)
        print("DATABASE REBUILT SUCCESSFULLY!")
        print("="*80)
        
        return True
        
    except Exception as e:
        print(f"\nERROR: Database rebuild failed: {e}")
        return False

if __name__ == "__main__":
    success = force_rebuild_database()
    if success:
        print("\nSUCCESS: Database rebuild completed successfully!")
    else:
        print("\nERROR: Database rebuild failed!")
        exit(1)
