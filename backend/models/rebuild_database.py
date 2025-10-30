#!/usr/bin/env python3
"""
Complete Database Rebuild Script for Seasonal Medicine Recommendation System
=======================================================================
Rebuilds the SQLite3 database from scratch using the exact schema specification.
Deletes existing database and recreates with real CSV data only.
"""

import sqlite3
import pandas as pd
import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

from config import DATABASE_PATH, INPUT_DIR
from utils import Logger

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DatabaseRebuilder:
    """Handles complete database rebuild with exact schema."""
    
    def __init__(self):
        self.db_path = DATABASE_PATH
        self.input_dir = INPUT_DIR
        self.csv_data = None
        self.connection = None
        
    def rebuild_database(self) -> bool:
        """
        Complete database rebuild process.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            print("="*80)
            print("COMPLETE DATABASE REBUILD")
            print("="*80)
            
            # Step 1: Delete existing database
            self._delete_existing_database()
            
            # Step 2: Load CSV data
            self._load_csv_data()
            
            # Step 3: Create new database with schema
            self._create_database_schema()
            
            # Step 4: Populate with real data
            self._populate_database()
            
            # Step 5: Verify and report
            self._verify_database()
            
            print("\n" + "="*80)
            print("DATABASE REBUILT SUCCESSFULLY!")
            print("="*80)
            
            return True
            
        except Exception as e:
            Logger.log_error(e, "Database Rebuild")
            print(f"\nERROR: Database rebuild failed: {e}")
            return False
        finally:
            if self.connection:
                self.connection.close()
    
    def _delete_existing_database(self):
        """Delete existing database file if it exists."""
        print("\n1. Checking for existing database...")
        
        if self.db_path.exists():
            print(f"   Found existing database: {self.db_path}")
            print("   Deleting existing database...")
            self.db_path.unlink()
            print("   SUCCESS: Existing database deleted successfully")
        else:
            print("   No existing database found")
    
    def _load_csv_data(self):
        """Load CSV data from input directory."""
        print("\n2. Loading CSV data...")
        
        # Find the most recent CSV file
        csv_files = list(self.input_dir.glob("*.csv"))
        if not csv_files:
            raise FileNotFoundError(f"No CSV files found in {self.input_dir}")
        
        latest_csv = max(csv_files, key=lambda f: f.stat().st_mtime)
        print(f"   Using CSV file: {latest_csv.name}")
        
        # Load CSV data
        self.csv_data = pd.read_csv(latest_csv)
        print(f"   ✓ Loaded {len(self.csv_data)} records from CSV")
        print(f"   Columns: {list(self.csv_data.columns)}")
        
        # Validate required columns
        required_columns = [
            'date', 'time', 'invoice_id', 'medicine_name', 'generic_name', 
            'brand', 'manufacturer', 'supplier', 'dosage_form', 'strength', 
            'category', 'prescription_required', 'quantity', 'unit_price'
        ]
        
        missing_columns = [col for col in required_columns if col not in self.csv_data.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        print("   SUCCESS: All required columns present")
    
    def _create_database_schema(self):
        """Create database with exact schema."""
        print("\n3. Creating database schema...")
        
        # Create database directory if needed
        self.db_path.parent.mkdir(exist_ok=True)
        
        # Connect to database
        self.connection = sqlite3.connect(str(self.db_path))
        cursor = self.connection.cursor()
        
        # Enable foreign keys
        cursor.execute("PRAGMA foreign_keys = ON")
        
        # Create tables in dependency order
        tables = [
            self._create_user_table(),
            self._create_manufacturers_table(),
            self._create_suppliers_table(),
            self._create_medicines_table(),
            self._create_medicine_suppliers_table(),
            self._create_customers_table(),
            self._create_inventory_table(),
            self._create_invoice_table(),
            self._create_sales_table(),
            self._create_prescription_table(),
            self._create_prescription_medicines_table(),
            self._create_purchase_invoice_table(),
            self._create_purchase_item_table(),
            self._create_medicine_return_table(),
            self._create_refund_table()
        ]
        
        for i, table_sql in enumerate(tables, 1):
            print(f"   {i}. Creating table...")
            cursor.execute(table_sql)
        
        # Create indexes for better performance
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
        
        self.connection.commit()
        print("   SUCCESS: Database schema created successfully")
    
    def _create_user_table(self):
        """Create User table."""
        return """
        CREATE TABLE User (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    
    def _create_manufacturers_table(self):
        """Create Manufacturers table."""
        return """
        CREATE TABLE Manufacturers (
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
        )
        """
    
    def _create_suppliers_table(self):
        """Create Suppliers table."""
        return """
        CREATE TABLE Suppliers (
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
        )
        """
    
    def _create_medicines_table(self):
        """Create Medicines table."""
        return """
        CREATE TABLE Medicines (
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
        )
        """
    
    def _create_medicine_suppliers_table(self):
        """Create Medicine_Suppliers mapping table."""
        return """
        CREATE TABLE Medicine_Suppliers (
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
        )
        """
    
    def _create_customers_table(self):
        """Create Customers table."""
        return """
        CREATE TABLE Customers (
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
        )
        """
    
    def _create_inventory_table(self):
        """Create Inventory table."""
        return """
        CREATE TABLE Inventory (
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
        )
        """
    
    def _create_invoice_table(self):
        """Create Invoice table."""
        return """
        CREATE TABLE Invoice (
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
        )
        """
    
    def _create_sales_table(self):
        """Create Sales table."""
        return """
        CREATE TABLE Sales (
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
        )
        """
    
    def _create_prescription_table(self):
        """Create Prescription table."""
        return """
        CREATE TABLE Prescription (
            prescription_id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            doctor_name TEXT,
            diagnosis TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
        )
        """
    
    def _create_prescription_medicines_table(self):
        """Create Prescription_Medicines mapping table."""
        return """
        CREATE TABLE Prescription_Medicines (
            prescription_medicine_id INTEGER PRIMARY KEY AUTOINCREMENT,
            prescription_id INTEGER NOT NULL,
            medicine_id INTEGER NOT NULL,
            dosage TEXT,
            frequency TEXT,
            duration TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (prescription_id) REFERENCES Prescription(prescription_id),
            FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id)
        )
        """
    
    def _create_purchase_invoice_table(self):
        """Create Purchase_Invoice table."""
        return """
        CREATE TABLE Purchase_Invoice (
            purchase_invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_id INTEGER NOT NULL,
            invoice_number TEXT,
            purchase_date DATE NOT NULL,
            total_amount REAL NOT NULL,
            payment_status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
        )
        """
    
    def _create_purchase_item_table(self):
        """Create Purchase_Item table."""
        return """
        CREATE TABLE Purchase_Item (
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
        )
        """
    
    def _create_medicine_return_table(self):
        """Create Medicine_Return table."""
        return """
        CREATE TABLE Medicine_Return (
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
        )
        """
    
    def _create_refund_table(self):
        """Create Refund table."""
        return """
        CREATE TABLE Refund (
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
        )
        """
    
    def _populate_database(self):
        """Populate database with real CSV data."""
        print("\n4. Populating database with real data...")
        
        cursor = self.connection.cursor()
        
        # Step 1: Create manufacturers from unique manufacturer names
        print("   Creating manufacturers...")
        manufacturers = self.csv_data['manufacturer'].dropna().unique()
        manufacturer_map = {}
        for i, manufacturer in enumerate(manufacturers, 1):
            cursor.execute("""
                INSERT INTO Manufacturers (manufacturer_id, manufacturer_name)
                VALUES (?, ?)
            """, (i, manufacturer))
            manufacturer_map[manufacturer] = i
        
        # Step 2: Create suppliers from unique supplier names
        print("   Creating suppliers...")
        suppliers = self.csv_data['supplier'].dropna().unique()
        supplier_map = {}
        for i, supplier in enumerate(suppliers, 1):
            cursor.execute("""
                INSERT INTO Suppliers (supplier_id, supplier_name)
                VALUES (?, ?)
            """, (i, supplier))
            supplier_map[supplier] = i
        
        # Step 3: Create medicines from unique medicine names
        print("   Creating medicines...")
        medicines = self.csv_data['medicine_name'].dropna().unique()
        medicine_map = {}
        for i, medicine in enumerate(medicines, 1):
            # Get first occurrence of this medicine for details
            medicine_data = self.csv_data[self.csv_data['medicine_name'] == medicine].iloc[0]
            
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
        
        # Step 4: Create medicine-supplier mappings
        print("   Creating medicine-supplier mappings...")
        medicine_supplier_pairs = self.csv_data[['medicine_name', 'supplier']].drop_duplicates()
        for i, (_, row) in enumerate(medicine_supplier_pairs.iterrows(), 1):
            medicine_id = medicine_map.get(row['medicine_name'])
            supplier_id = supplier_map.get(row['supplier'])
            
            if medicine_id and supplier_id:
                cursor.execute("""
                    INSERT INTO Medicine_Suppliers (medicine_supplier_id, medicine_id, supplier_id)
                    VALUES (?, ?, ?)
                """, (i, medicine_id, supplier_id))
        
        # Step 5: Create invoices from unique invoice IDs
        print("   Creating invoices...")
        invoices = self.csv_data['invoice_id'].dropna().unique()
        invoice_data = {}
        
        for invoice_id in invoices:
            invoice_sales = self.csv_data[self.csv_data['invoice_id'] == invoice_id]
            total_amount = (invoice_sales['quantity'] * invoice_sales['unit_price']).sum()
            sale_date = invoice_sales['date'].iloc[0]
            
            cursor.execute("""
                INSERT INTO Invoice (invoice_id, sale_date, total_amount)
                VALUES (?, ?, ?)
            """, (invoice_id, sale_date, total_amount))
            
            invoice_data[invoice_id] = {
                'sale_date': sale_date,
                'total_amount': total_amount
            }
        
        # Step 6: Create sales records
        print("   Creating sales records...")
        for i, (_, row) in enumerate(self.csv_data.iterrows(), 1):
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
        
        # Step 7: Create default admin user
        print("   Creating default admin user...")
        cursor.execute("""
            INSERT INTO User (username, email, password_hash, role)
            VALUES ('admin', 'admin@pharmacy.com', 'hashed_password', 'admin')
        """)
        
        self.connection.commit()
        print("   SUCCESS: Database populated successfully")
    
    def _verify_database(self):
        """Verify database and print summary."""
        print("\n5. Verifying database...")
        
        cursor = self.connection.cursor()
        
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
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"   {table:<25}: {count:>8} records")
                total_records += count
            except sqlite3.OperationalError:
                print(f"   {table:<25}: {0:>8} records (table empty)")
        
        print("   " + "-" * 50)
        print(f"   {'TOTAL':<25}: {total_records:>8} records")
        
        # Get database file size
        file_size = self.db_path.stat().st_size
        file_size_mb = file_size / (1024 * 1024)
        print(f"\n   Database file size: {file_size_mb:.2f} MB")
        print(f"   Database created at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


def rebuild_database():
    """
    Main function to rebuild the database.
    
    Returns:
        bool: True if successful, False otherwise
    """
    rebuilder = DatabaseRebuilder()
    return rebuilder.rebuild_database()


if __name__ == "__main__":
    success = rebuild_database()
    if success:
        print("\nSUCCESS: Database rebuild completed successfully!")
    else:
        print("\nERROR: Database rebuild failed!")
        exit(1)
