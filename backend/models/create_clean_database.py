"""
Create a clean database with the exact schema specified by the user.
This script creates only the required tables and populates them from the CSV data.
"""

import sqlite3
import pandas as pd
from pathlib import Path
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent.parent
DATABASE_PATH = BASE_DIR / "database" / "pharmacy_backup.db"
CSV_PATH = BASE_DIR / "input" / "konkan_pharmacy_sales_55k.csv"

def create_database_schema():
    """Create the database with the exact schema specified."""
    
    # Ensure database directory exists
    DATABASE_PATH.parent.mkdir(exist_ok=True)
    
    # Remove existing database if it exists
    if DATABASE_PATH.exists():
        DATABASE_PATH.unlink()
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        logger.info("Creating database schema...")
        
        # User table
        cursor.execute("""
        CREATE TABLE User (
            user_id INTEGER PRIMARY KEY
        )
        """)
        
        # Manufacturers table
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Suppliers table
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Medicines table
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (manufacturer_id) REFERENCES Manufacturers(manufacturer_id)
        )
        """)
        
        # Medicine_Suppliers table
        cursor.execute("""
        CREATE TABLE Medicine_Suppliers (
            medicine_supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine_id INTEGER NOT NULL,
            supplier_id INTEGER NOT NULL,
            default_purchase_price REAL DEFAULT 0,
            gst_percentage REAL DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id),
            FOREIGN KEY (supplier_id) REFERENCES Suppliers(supplier_id)
        )
        """)
        
        # Inventory table
        cursor.execute("""
        CREATE TABLE Inventory (
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
        )
        """)
        
        # Customers table
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
            outstanding_credit REAL DEFAULT 0,
            payment_status TEXT DEFAULT 'current',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Invoice table
        cursor.execute("""
        CREATE TABLE Invoice (
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
        )
        """)
        
        # Sales table
        cursor.execute("""
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
            payment_method TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (invoice_id) REFERENCES Invoice(invoice_id),
            FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id),
            FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
        )
        """)
        
        # Prescription table
        cursor.execute("""
        CREATE TABLE Prescription (
            prescription_id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            doctor_name TEXT,
            diagnosis TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
        )
        """)
        
        # Prescription_Medicines table
        cursor.execute("""
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
        """)
        
        # Purchase_Invoice table
        cursor.execute("""
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
        """)
        
        # Purchase_Item table
        cursor.execute("""
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
        """)
        
        # Medicine_Return table
        cursor.execute("""
        CREATE TABLE Medicine_Return (
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
        )
        """)
        
        # Refund table
        cursor.execute("""
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
        """)
        
        # Create indexes for better performance
        cursor.execute("CREATE INDEX idx_sales_invoice_id ON Sales(invoice_id)")
        cursor.execute("CREATE INDEX idx_sales_medicine_id ON Sales(medicine_id)")
        cursor.execute("CREATE INDEX idx_sales_date ON Sales(date_of_sale)")
        cursor.execute("CREATE INDEX idx_medicines_name ON Medicines(medicine_name)")
        cursor.execute("CREATE INDEX idx_medicines_category ON Medicines(category)")
        
        conn.commit()
        logger.info("Database schema created successfully")
        
    except Exception as e:
        logger.error(f"Error creating schema: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def populate_database():
    """Populate the database with data from CSV."""
    
    logger.info("Loading CSV data...")
    df = pd.read_csv(CSV_PATH)
    logger.info(f"Loaded {len(df)} records from CSV")
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        # Create default user with fixed ID
        cursor.execute("""
        INSERT INTO User (user_id) VALUES (1)
        """)
        
        # Get unique manufacturers
        manufacturers = df['manufacturer'].dropna().unique()
        logger.info(f"Found {len(manufacturers)} unique manufacturers")
        
        manufacturer_map = {}
        for manufacturer in manufacturers:
            cursor.execute("""
            INSERT INTO Manufacturers (manufacturer_name, is_active)
            VALUES (?, 1)
            """, (manufacturer,))
            manufacturer_map[manufacturer] = cursor.lastrowid
        
        # Get unique suppliers
        suppliers = df['supplier'].dropna().unique()
        logger.info(f"Found {len(suppliers)} unique suppliers")
        
        supplier_map = {}
        for supplier in suppliers:
            cursor.execute("""
            INSERT INTO Suppliers (supplier_name, is_active)
            VALUES (?, 1)
            """, (supplier,))
            supplier_map[supplier] = cursor.lastrowid
        
        # Get unique medicines
        medicines = df[['medicine_name', 'generic_name', 'brand', 'dosage_form', 'strength', 'category', 'prescription_required', 'manufacturer']].drop_duplicates()
        logger.info(f"Found {len(medicines)} unique medicines")
        
        medicine_map = {}
        for _, medicine in medicines.iterrows():
            manufacturer_id = manufacturer_map.get(medicine['manufacturer'])
            cursor.execute("""
            INSERT INTO Medicines (medicine_name, generic_name, brand, dosage_form, strength, category, prescription_required, manufacturer_id, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                medicine['medicine_name'],
                medicine['generic_name'],
                medicine['brand'],
                medicine['dosage_form'],
                medicine['strength'],
                medicine['category'],
                medicine['prescription_required'],
                manufacturer_id
            ))
            medicine_map[medicine['medicine_name']] = cursor.lastrowid
        
        # Create medicine-supplier mappings
        for medicine_name, supplier in df[['medicine_name', 'supplier']].drop_duplicates().values:
            if medicine_name in medicine_map and supplier in supplier_map:
                cursor.execute("""
                INSERT INTO Medicine_Suppliers (medicine_id, supplier_id, is_active)
                VALUES (?, ?, 1)
                """, (medicine_map[medicine_name], supplier_map[supplier]))
        
        # Create invoices
        invoices = df[['invoice_id', 'date']].drop_duplicates()
        logger.info(f"Found {len(invoices)} unique invoices")
        
        for _, invoice in invoices.iterrows():
            # Calculate total amount for this invoice
            invoice_sales = df[df['invoice_id'] == invoice['invoice_id']]
            total_amount = (invoice_sales['quantity'] * invoice_sales['unit_price']).sum()
            
            cursor.execute("""
            INSERT INTO Invoice (invoice_id, sale_date, total_amount, payment_status)
            VALUES (?, ?, ?, 'paid')
            """, (invoice['invoice_id'], invoice['date'], total_amount))
        
        # Create sales records
        logger.info("Creating sales records...")
        for _, sale in df.iterrows():
            medicine_id = medicine_map.get(sale['medicine_name'])
            if medicine_id:
                total_amount = sale['quantity'] * sale['unit_price']
                cursor.execute("""
                INSERT INTO Sales (invoice_id, date_of_sale, time_of_sale, medicine_id, quantity_sold, unit_price_at_sale, total_amount, payment_method)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'cash')
                """, (
                    sale['invoice_id'],
                    sale['date'],
                    sale['time'],
                    medicine_id,
                    sale['quantity'],
                    sale['unit_price'],
                    total_amount
                ))
        
        conn.commit()
        logger.info("Database populated successfully")
        
        # Print summary
        cursor.execute("SELECT COUNT(*) FROM Sales")
        sales_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Medicines")
        medicines_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Manufacturers")
        manufacturers_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Suppliers")
        suppliers_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM Invoice")
        invoices_count = cursor.fetchone()[0]
        
        logger.info(f"""
        Database Summary:
        - Sales: {sales_count:,} records
        - Medicines: {medicines_count:,} records
        - Manufacturers: {manufacturers_count:,} records
        - Suppliers: {suppliers_count:,} records
        - Invoices: {invoices_count:,} records
        """)
        
    except Exception as e:
        logger.error(f"Error populating database: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def main():
    """Main function to create and populate the database."""
    try:
        logger.info("Creating clean database...")
        create_database_schema()
        populate_database()
        logger.info("✅ Database creation completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Database creation failed: {e}")
        raise

if __name__ == "__main__":
    main()
