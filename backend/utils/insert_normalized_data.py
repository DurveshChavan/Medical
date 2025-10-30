import sqlite3
import pandas as pd
import os
from typing import Dict, List, Any

def get_database_connection():
    """Get database connection."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    db_path = os.path.join(project_root, "database", "pharmacy_backup.db")
    return sqlite3.connect(db_path)

def get_table_schema(conn, table_name: str) -> List[str]:
    """Get column names for a table."""
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [row[1] for row in cursor.fetchall()]
    return columns

def get_existing_tables(conn) -> List[str]:
    """Get list of existing tables."""
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    return [row[0] for row in cursor.fetchall()]

def create_missing_tables(conn):
    """Create missing tables based on CSV structure."""
    cursor = conn.cursor()
    
    # Check if Customers table exists and drop it if it has wrong schema
    existing_tables = get_existing_tables(conn)
    if 'Customers' in existing_tables:
        cursor.execute("DROP TABLE IF EXISTS Customers")
    
    # Create Customers table
    cursor.execute("""
    CREATE TABLE Customers (
        customer_id TEXT PRIMARY KEY,
        invoice_id TEXT,
        customer_name TEXT,
        city TEXT,
        state TEXT,
        created_at DATE
    )
    """)
    
    # Drop and recreate other tables to match CSV schema
    tables_to_drop = ['Inventory', 'Purchase_Invoice', 'Purchase_Item', 'Medicine_Return', 'Prescription', 'Prescription_Medicines', 'Refund']
    for table in tables_to_drop:
        if table in existing_tables:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
    
    # Create Inventory table
    cursor.execute("""
    CREATE TABLE Inventory (
        medicine_id TEXT PRIMARY KEY,
        medicine_name TEXT,
        generic_name TEXT,
        brand TEXT,
        manufacturer TEXT,
        supplier TEXT,
        dosage_form TEXT,
        strength TEXT,
        category TEXT,
        prescription_required INTEGER,
        stock_level INTEGER,
        expiry_date DATE
    )
    """)
    
    # Create Purchase_Invoice table
    cursor.execute("""
    CREATE TABLE Purchase_Invoice (
        invoice_id TEXT PRIMARY KEY,
        customer_id TEXT,
        purchase_date DATE,
        total_amount REAL,
        FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
    )
    """)
    
    # Create Purchase_Item table
    cursor.execute("""
    CREATE TABLE Purchase_Item (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id TEXT,
        purchase_datetime DATETIME,
        medicine_id TEXT,
        medicine_name TEXT,
        quantity INTEGER,
        unit_price REAL,
        line_total REAL,
        FOREIGN KEY (invoice_id) REFERENCES Purchase_Invoice(invoice_id),
        FOREIGN KEY (medicine_id) REFERENCES Inventory(medicine_id)
    )
    """)
    
    # Create Medicine_Return table
    cursor.execute("""
    CREATE TABLE Medicine_Return (
        return_id TEXT PRIMARY KEY,
        invoice_id TEXT,
        medicine_id TEXT,
        quantity_returned INTEGER,
        return_date DATE,
        reason TEXT,
        refund_eligible BOOLEAN,
        FOREIGN KEY (invoice_id) REFERENCES Purchase_Invoice(invoice_id),
        FOREIGN KEY (medicine_id) REFERENCES Inventory(medicine_id)
    )
    """)
    
    # Create Prescription table
    cursor.execute("""
    CREATE TABLE Prescription (
        prescription_id TEXT PRIMARY KEY,
        invoice_id TEXT,
        doctor_name TEXT,
        hospital TEXT,
        prescription_date DATE,
        FOREIGN KEY (invoice_id) REFERENCES Purchase_Invoice(invoice_id)
    )
    """)
    
    # Create Prescription_Medicines table
    cursor.execute("""
    CREATE TABLE Prescription_Medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prescription_id TEXT,
        medicine_id TEXT,
        quantity INTEGER,
        FOREIGN KEY (prescription_id) REFERENCES Prescription(prescription_id),
        FOREIGN KEY (medicine_id) REFERENCES Inventory(medicine_id)
    )
    """)
    
    # Create Refund table
    cursor.execute("""
    CREATE TABLE Refund (
        refund_id TEXT PRIMARY KEY,
        return_id TEXT,
        refund_amount REAL,
        refund_date DATE,
        method TEXT,
        FOREIGN KEY (return_id) REFERENCES Medicine_Return(return_id)
    )
    """)
    
    conn.commit()

def insert_csv_data(conn, csv_path: str, table_name: str):
    """Insert CSV data into database table."""
    print(f"Inserting data from {csv_path} into {table_name}...")
    
    try:
        # Read CSV
        df = pd.read_csv(csv_path)
        
        # Get table columns
        table_columns = get_table_schema(conn, table_name)
        
        # Filter DataFrame to match table columns
        available_columns = [col for col in df.columns if col in table_columns]
        df_filtered = df[available_columns]
        
        # Handle NaN values
        df_filtered = df_filtered.fillna('')
        
        # Insert data
        cursor = conn.cursor()
        
        # Clear existing data
        cursor.execute(f"DELETE FROM {table_name}")
        
        # Insert new data
        placeholders = ', '.join(['?' for _ in available_columns])
        columns_str = ', '.join(available_columns)
        
        for _, row in df_filtered.iterrows():
            values = []
            for col in available_columns:
                val = row[col]
                # Convert NaN to None for SQLite
                if pd.isna(val):
                    val = None
                values.append(val)
            
            cursor.execute(f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})", values)
        
        conn.commit()
        print(f"Inserted {len(df_filtered)} rows into {table_name}")
        
    except Exception as e:
        print(f"Error inserting into {table_name}: {e}")
        conn.rollback()
        raise

def main():
    """Main function to insert all normalized data."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    csv_dir = os.path.join(project_root, "output", "normalized_dataset")
    
    conn = get_database_connection()
    
    try:
        print("Creating missing tables...")
        create_missing_tables(conn)
        
        # Define CSV to table mapping
        csv_mappings = {
            "Customers.csv": "Customers",
            "Inventory.csv": "Inventory", 
            "Purchase_Invoice.csv": "Purchase_Invoice",
            "Purchase_Item.csv": "Purchase_Item",
            "Medicine_Return.csv": "Medicine_Return",
            "Prescription.csv": "Prescription",
            "Prescription_Medicines.csv": "Prescription_Medicines",
            "Refund.csv": "Refund"
        }
        
        # Insert data for each CSV
        for csv_file, table_name in csv_mappings.items():
            csv_path = os.path.join(csv_dir, csv_file)
            if os.path.exists(csv_path):
                insert_csv_data(conn, csv_path, table_name)
            else:
                print(f"Warning: {csv_file} not found")
        
        print("Data insertion completed successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
