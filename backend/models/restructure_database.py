"""
Database Restructuring Script
Updates the existing pharmacy_backup.db to only include the specified tables.
"""

import sqlite3
import logging
from pathlib import Path
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database path
DATABASE_PATH = Path("../database/pharmacy_backup.db")

def backup_database():
    """Create a backup of the current database."""
    backup_path = Path("../database/pharmacy_backup.db")
    if DATABASE_PATH.exists():
        import shutil
        shutil.copy2(DATABASE_PATH, backup_path)
        logger.info(f"Database backed up to: {backup_path}")
        return backup_path
    return None

def get_existing_tables(conn):
    """Get list of existing tables in the database."""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    return tables

def create_new_schema(conn):
    """Create the new database schema with only specified tables."""
    cursor = conn.cursor()
    
    # Drop all existing tables (except sqlite_sequence)
    existing_tables = get_existing_tables(conn)
    logger.info(f"Found existing tables: {existing_tables}")
    
    for table in existing_tables:
        if table != 'sqlite_sequence':
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            logger.info(f"Dropped table: {table}")
    
    # Clear sqlite_sequence table
    cursor.execute("DELETE FROM sqlite_sequence")
    logger.info("Cleared sqlite_sequence table")
    
    # Create User table
    cursor.execute("""
    CREATE TABLE User (
        user_id INTEGER PRIMARY KEY
    )
    """)
    
    # Create Sales table
    cursor.execute("""
    CREATE TABLE Sales (
        sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id TEXT NOT NULL,
        date_of_sale DATE NOT NULL,
        time_of_sale TIME NOT NULL,
        medicine_id INTEGER NOT NULL,
        quantity_sold INTEGER NOT NULL,
        unit_price_at_sale DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        customer_id INTEGER,
        payment_method TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id),
        FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
    )
    """)
    
    # Create Medicines table
    cursor.execute("""
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (manufacturer_id) REFERENCES Manufacturers(manufacturer_id)
    )
    """)
    
    # Create Manufacturers table
    cursor.execute("""
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
        country TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create Suppliers table
    cursor.execute("""
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
        country TEXT,
        gstin TEXT,
        pan_number TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create Medicine_Suppliers table
    cursor.execute("""
    CREATE TABLE Medicine_Suppliers (
        medicine_supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicine_id INTEGER NOT NULL,
        supplier_id INTEGER NOT NULL,
        default_purchase_price DECIMAL(10,2),
        gst_percentage DECIMAL(5,2),
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id),
        FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
    )
    """)
    
    # Create Inventory table
    cursor.execute("""
    CREATE TABLE Inventory (
        inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicine_id INTEGER NOT NULL,
        supplier_id INTEGER NOT NULL,
        batch_number TEXT NOT NULL,
        expiry_date DATE NOT NULL,
        quantity_in_stock INTEGER NOT NULL,
        purchase_price_per_unit DECIMAL(10,2) NOT NULL,
        selling_price_per_unit DECIMAL(10,2) NOT NULL,
        reorder_level INTEGER DEFAULT 0,
        last_restocked_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id),
        FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
    )
    """)
    
    # Create Customers table
    cursor.execute("""
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
        outstanding_credit DECIMAL(10,2) DEFAULT 0,
        payment_status TEXT DEFAULT 'current',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create Invoice table
    cursor.execute("""
    CREATE TABLE Invoice (
        invoice_id TEXT PRIMARY KEY,
        sale_date DATE NOT NULL,
        customer_id INTEGER,
        total_amount DECIMAL(10,2) NOT NULL,
        total_gst DECIMAL(10,2) DEFAULT 0,
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        outstanding_credit DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
    )
    """)
    
    # Create Prescription table
    cursor.execute("""
    CREATE TABLE Prescription (
        prescription_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        doctor_name TEXT,
        diagnosis TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
    )
    """)
    
    # Create Prescription_Medicines table
    cursor.execute("""
    CREATE TABLE Prescription_Medicines (
        prescription_medicine_id INTEGER PRIMARY KEY AUTOINCREMENT,
        prescription_id INTEGER NOT NULL,
        medicine_id INTEGER NOT NULL,
        dosage TEXT,
        frequency TEXT,
        duration TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prescription_id) REFERENCES Prescription(prescription_id),
        FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id)
    )
    """)
    
    # Create Purchase_Invoice table
    cursor.execute("""
    CREATE TABLE Purchase_Invoice (
        purchase_invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        invoice_number TEXT NOT NULL,
        purchase_date DATE NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
    )
    """)
    
    # Create Purchase_Item table
    cursor.execute("""
    CREATE TABLE Purchase_Item (
        purchase_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_invoice_id INTEGER NOT NULL,
        medicine_id INTEGER NOT NULL,
        supplier_id INTEGER NOT NULL,
        batch_number TEXT NOT NULL,
        expiry_date DATE NOT NULL,
        quantity_purchased INTEGER NOT NULL,
        cost_per_unit DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (purchase_invoice_id) REFERENCES Purchase_Invoice(purchase_invoice_id),
        FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id),
        FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
    )
    """)
    
    # Create Medicine_Return table
    cursor.execute("""
    CREATE TABLE Medicine_Return (
        return_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        medicine_id INTEGER NOT NULL,
        quantity_returned INTEGER NOT NULL,
        reason_for_return TEXT,
        return_date DATE NOT NULL,
        refund_amount DECIMAL(10,2) NOT NULL,
        processed_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES Sales(sale_id),
        FOREIGN KEY (customer_id) REFERENCES Customers(customer_id),
        FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id)
    )
    """)
    
    # Create Refund table
    cursor.execute("""
    CREATE TABLE Refund (
        refund_id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        payment_method TEXT,
        refund_amount DECIMAL(10,2) NOT NULL,
        refund_date DATE NOT NULL,
        approved_by TEXT,
        refund_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (return_id) REFERENCES Medicine_Return(return_id),
        FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
    )
    """)
    
    # Insert default user
    cursor.execute("INSERT INTO User (user_id) VALUES (1)")
    
    conn.commit()
    logger.info("New database schema created successfully")

def restructure_database():
    """Main function to restructure the database."""
    try:
        # Create backup
        backup_path = backup_database()
        
        # Connect to database
        conn = sqlite3.connect(DATABASE_PATH)
        logger.info(f"Connected to database: {DATABASE_PATH}")
        
        # Create new schema
        create_new_schema(conn)
        
        # Close connection
        conn.close()
        
        logger.info("Database restructuring completed successfully!")
        logger.info(f"Backup available at: {backup_path}")
        
    except Exception as e:
        logger.error(f"Error restructuring database: {str(e)}")
        raise

if __name__ == "__main__":
    restructure_database()
