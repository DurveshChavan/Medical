#!/usr/bin/env python3
"""
Database Population Script for Seasonal Medicine Recommendation System
===================================================================
Reads the most recently uploaded CSV file from /input/ folder and populates
the database with real data. Handles missing or optional fields gracefully.
"""

import sqlite3
import csv
import os
import pandas as pd
from pathlib import Path
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_latest_csv_file():
    """Get the most recently uploaded CSV file from /input/ folder."""
    
    project_root = Path(__file__).parent.parent
    input_dir = project_root / "input"
    
    if not input_dir.exists():
        raise FileNotFoundError(f"Input directory not found: {input_dir}")
    
    # Find all CSV files in input directory
    csv_files = list(input_dir.glob("*.csv"))
    
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in: {input_dir}")
    
    # Get the most recently modified CSV file
    latest_csv = max(csv_files, key=lambda f: f.stat().st_mtime)
    
    logger.info(f"Found {len(csv_files)} CSV files in input directory")
    logger.info(f"Using latest file: {latest_csv.name}")
    logger.info(f"File size: {latest_csv.stat().st_size / 1024 / 1024:.2f} MB")
    logger.info(f"Last modified: {datetime.fromtimestamp(latest_csv.stat().st_mtime)}")
    
    return latest_csv

def clean_data_value(value):
    """Clean and standardize data values."""
    if pd.isna(value) or value is None or value == '':
        return None
    
    # Convert to string and strip whitespace
    cleaned = str(value).strip()
    
    # Handle special cases
    if cleaned.lower() in ['nan', 'none', 'null', '']:
        return None
    
    return cleaned

def populate_database():
    """Populate the database with CSV data."""
    
    print("="*80)
    print("SEASONAL MEDICINE RECOMMENDATION SYSTEM")
    print("Database Population Script")
    print("="*80)
    
    # Get project root directory
    project_root = Path(__file__).parent.parent
    database_path = project_root / "database" / "pharmacy_backup.db"
    
    # Check if database exists
    if not database_path.exists():
        print(f"ERROR: Database not found at {database_path}")
        print("Please run create_database.py first!")
        return False
    
    print(f"Database file: {database_path}")
    
    # Get the latest CSV file
    try:
        csv_file = get_latest_csv_file()
        print(f"CSV file: {csv_file}")
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        return False
    
    # Connect to database
    conn = sqlite3.connect(str(database_path))
    cursor = conn.cursor()
    
    # Enable foreign key constraints
    cursor.execute("PRAGMA foreign_keys = ON")
    
    print("\nReading CSV data...")
    print("-" * 80)
    
    try:
        # Read CSV using pandas for better handling
        df = pd.read_csv(csv_file)
        print(f"CSV loaded successfully: {len(df)} rows, {len(df.columns)} columns")
        
        # Display basic info about the data
        print(f"Columns: {list(df.columns)}")
        print(f"Date range: {df['date'].min()} to {df['date'].max()}")
        print(f"Unique medicines: {df['medicine_name'].nunique()}")
        print(f"Unique invoices: {df['invoice_id'].nunique()}")
        
    except Exception as e:
        print(f"ERROR: Failed to read CSV file: {e}")
        return False
    
    print("\nProcessing and inserting data...")
    print("-" * 80)
    
    # Clear existing data (optional - comment out if you want to keep existing data)
    print("Clearing existing data...")
    tables_to_clear = ['sales', 'medicine_master', 'seasonal_analysis', 'recommendations', 'forecasts']
    for table in tables_to_clear:
        cursor.execute(f"DELETE FROM {table}")
        print(f"  - Cleared {table} table")
    
    # 1. Insert sales data
    print("\n1. Inserting sales data...")
    sales_inserted = 0
    
    for index, row in df.iterrows():
        try:
            # Clean and prepare data
            sales_data = {
                'date': clean_data_value(row.get('date')),
                'time': clean_data_value(row.get('time')),
                'invoice_id': clean_data_value(row.get('invoice_id')),
                'medicine_name': clean_data_value(row.get('medicine_name')),
                'generic_name': clean_data_value(row.get('generic_name')),
                'brand': clean_data_value(row.get('brand')),
                'manufacturer': clean_data_value(row.get('manufacturer')),
                'supplier': clean_data_value(row.get('supplier')),
                'dosage_form': clean_data_value(row.get('dosage_form')),
                'strength': clean_data_value(row.get('strength')),
                'category': clean_data_value(row.get('category')),
                'prescription_required': int(row.get('prescription_required', 0)) if pd.notna(row.get('prescription_required')) else 0,
                'quantity': int(row.get('quantity', 0)) if pd.notna(row.get('quantity')) else 0,
                'unit_price': float(row.get('unit_price', 0.0)) if pd.notna(row.get('unit_price')) else 0.0
            }
            
            # Skip rows with missing critical data
            if not all([sales_data['date'], sales_data['medicine_name'], sales_data['quantity'], sales_data['unit_price']]):
                continue
            
            # Insert sales record
            cursor.execute("""
                INSERT INTO sales (
                    date, time, invoice_id, medicine_name, generic_name, brand,
                    manufacturer, supplier, dosage_form, strength, category,
                    prescription_required, quantity, unit_price
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sales_data['date'], sales_data['time'], sales_data['invoice_id'],
                sales_data['medicine_name'], sales_data['generic_name'], sales_data['brand'],
                sales_data['manufacturer'], sales_data['supplier'], sales_data['dosage_form'],
                sales_data['strength'], sales_data['category'], sales_data['prescription_required'],
                sales_data['quantity'], sales_data['unit_price']
            ))
            
            sales_inserted += 1
            
            if sales_inserted % 10000 == 0:
                print(f"  - Inserted {sales_inserted:,} sales records...")
                
        except Exception as e:
            logger.warning(f"Failed to insert row {index}: {e}")
            continue
    
    print(f"  - Total sales records inserted: {sales_inserted:,}")
    
    # 2. Create medicine master data
    print("\n2. Creating medicine master data...")
    
    # Aggregate medicine data
    medicine_aggregated = df.groupby('medicine_name').agg({
        'generic_name': lambda x: ', '.join(x.dropna().unique()),
        'category': lambda x: x.mode()[0] if len(x.mode()) > 0 else 'Unknown',
        'dosage_form': lambda x: x.mode()[0] if len(x.mode()) > 0 else 'Unknown',
        'strength': lambda x: x.mode()[0] if len(x.mode()) > 0 else 'Unknown',
        'manufacturer': lambda x: x.mode()[0] if len(x.mode()) > 0 else 'Unknown',
        'quantity': 'sum',
        'unit_price': 'mean',
        'invoice_id': 'nunique'
    }).reset_index()
    
    medicine_aggregated.columns = [
        'medicine_name', 'generic_names', 'primary_category', 'primary_dosage_form',
        'primary_strength', 'primary_manufacturer', 'total_quantity_sold',
        'avg_unit_price_INR', 'unique_orders'
    ]
    
    # Calculate total revenue
    medicine_aggregated['total_revenue_INR'] = medicine_aggregated['total_quantity_sold'] * medicine_aggregated['avg_unit_price_INR']
    
    # Sort by quantity and add rank
    medicine_aggregated = medicine_aggregated.sort_values('total_quantity_sold', ascending=False).reset_index(drop=True)
    medicine_aggregated['rank'] = range(1, len(medicine_aggregated) + 1)
    
    # Insert medicine master data
    medicine_master_inserted = 0
    for _, row in medicine_aggregated.iterrows():
        try:
            cursor.execute("""
                INSERT INTO medicine_master (
                    medicine_name, generic_names, primary_category, primary_dosage_form,
                    primary_strength, primary_manufacturer, total_quantity_sold,
                    total_revenue_INR, avg_unit_price_INR, unique_orders, rank
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                row['medicine_name'], row['generic_names'], row['primary_category'],
                row['primary_dosage_form'], row['primary_strength'], row['primary_manufacturer'],
                int(row['total_quantity_sold']), float(row['total_revenue_INR']),
                float(row['avg_unit_price_INR']), int(row['unique_orders']), int(row['rank'])
            ))
            medicine_master_inserted += 1
        except Exception as e:
            logger.warning(f"Failed to insert medicine master row: {e}")
            continue
    
    print(f"  - Medicine master records inserted: {medicine_master_inserted:,}")
    
    # 3. Create manufacturer data
    print("\n3. Creating manufacturer data...")
    
    manufacturer_data = df.groupby('manufacturer').agg({
        'medicine_name': 'nunique',
        'unit_price': lambda x: (df.loc[df['manufacturer'] == x.name, 'quantity'] * df.loc[df['manufacturer'] == x.name, 'unit_price']).sum()
    }).reset_index()
    
    manufacturer_data.columns = ['manufacturer_name', 'total_medicines', 'total_revenue']
    
    manufacturer_inserted = 0
    for _, row in manufacturer_data.iterrows():
        if pd.notna(row['manufacturer_name']):
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO manufacturers (
                        manufacturer_name, total_medicines, total_revenue
                    ) VALUES (?, ?, ?)
                """, (row['manufacturer_name'], int(row['total_medicines']), float(row['total_revenue'])))
                manufacturer_inserted += 1
            except Exception as e:
                logger.warning(f"Failed to insert manufacturer: {e}")
                continue
    
    print(f"  - Manufacturer records inserted: {manufacturer_inserted:,}")
    
    # 4. Create category data
    print("\n4. Creating category data...")
    
    category_data = df.groupby('category').agg({
        'medicine_name': 'nunique',
        'unit_price': lambda x: (df.loc[df['category'] == x.name, 'quantity'] * df.loc[df['category'] == x.name, 'unit_price']).sum()
    }).reset_index()
    
    category_data.columns = ['category_name', 'total_medicines', 'total_revenue']
    
    category_inserted = 0
    for _, row in category_data.iterrows():
        if pd.notna(row['category_name']):
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO categories (
                        category_name, total_medicines, total_revenue
                    ) VALUES (?, ?, ?)
                """, (row['category_name'], int(row['total_medicines']), float(row['total_revenue'])))
                category_inserted += 1
            except Exception as e:
                logger.warning(f"Failed to insert category: {e}")
                continue
    
    print(f"  - Category records inserted: {category_inserted:,}")
    
    # 5. Create supplier data
    print("\n5. Creating supplier data...")
    
    supplier_data = df.groupby('supplier').agg({
        'medicine_name': 'nunique',
        'unit_price': lambda x: (df.loc[df['supplier'] == x.name, 'quantity'] * df.loc[df['supplier'] == x.name, 'unit_price']).sum()
    }).reset_index()
    
    supplier_data.columns = ['supplier_name', 'total_medicines', 'total_revenue']
    
    supplier_inserted = 0
    for _, row in supplier_data.iterrows():
        if pd.notna(row['supplier_name']):
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO suppliers (
                        supplier_name, total_medicines, total_revenue
                    ) VALUES (?, ?, ?)
                """, (row['supplier_name'], int(row['total_medicines']), float(row['total_revenue'])))
                supplier_inserted += 1
            except Exception as e:
                logger.warning(f"Failed to insert supplier: {e}")
                continue
    
    print(f"  - Supplier records inserted: {supplier_inserted:,}")
    
    # Commit all changes
    conn.commit()
    
    # Verify data insertion
    print("\nVerifying data insertion...")
    print("-" * 80)
    
    tables_to_check = [
        ('sales', 'Sales transactions'),
        ('medicine_master', 'Medicine master list'),
        ('manufacturers', 'Manufacturers'),
        ('categories', 'Categories'),
        ('suppliers', 'Suppliers')
    ]
    
    for table_name, description in tables_to_check:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"  - {description}: {count:,} records")
    
    # Get database file size
    file_size = database_path.stat().st_size
    file_size_mb = file_size / (1024 * 1024)
    
    print(f"\nDatabase file size: {file_size_mb:.2f} MB")
    print(f"Data populated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Close connection
    conn.close()
    
    print("\n" + "="*80)
    print("CSV data successfully loaded into database.")
    print("="*80)
    
    return True

if __name__ == "__main__":
    try:
        success = populate_database()
        if success:
            print("\nSUCCESS: Database population completed!")
        else:
            print("\nERROR: Database population failed!")
            exit(1)
    except Exception as e:
        print(f"\nERROR: Database population failed: {e}")
        exit(1)
