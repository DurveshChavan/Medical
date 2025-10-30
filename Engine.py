#
# Project Title: An Integrated System for Seasonal Medical Storage Recommendation and Pharmacy Process Optimization
#
# Phase 1: Development of the Core Seasonal Analytics Engine
# Enhanced Version with Advanced Features
#
# ================================================================================================
# REFACTORED BACKEND ARCHITECTURE (Modular Version Available)
# ================================================================================================
# This monolithic file has been successfully refactored into a clean, modular backend system.
# The refactored version provides the same functionality with improved maintainability and scalability.
#
# REFACTORED BACKEND STRUCTURE:
# -----------------------------
# backend/
# ├── __init__.py          # Package initialization and module exports
# ├── config.py            # Central configuration, paths, and environment constants
# ├── database.py          # SQLite connection management and database operations
# ├── models.py            # Database schemas and table definitions (based on real CSV structure)
# ├── data_loader.py       # CSV file reading, validation, and database loading
# ├── analyzer.py          # All analytical logic (seasonal analysis, recommendations, forecasting)
# ├── routes.py            # Flask API endpoints for web integration
# ├── utils.py             # Utility functions, helpers, and data processing
# └── app.py               # Flask application entry point and server configuration
#
# KEY IMPROVEMENTS IN REFACTORED VERSION:
# --------------------------------------
# ✅ Modular Design: 8 specialized modules vs 1 monolithic file (1,857 lines)
# ✅ Database Integration: Full SQLite database with normalized schema
# ✅ API Framework: RESTful Flask endpoints ready for frontend integration
# ✅ Error Handling: Comprehensive logging and graceful error management
# ✅ Configuration: Centralized settings with environment-based configuration
# ✅ Type Safety: Full type hints and documentation
# ✅ Production Ready: Proper error handling, logging, and monitoring
#
# FUNCTIONAL COMPATIBILITY:
# -------------------------
# The refactored system maintains 100% functional compatibility with this original Engine.py
# while providing improved architecture, database persistence, and web API capabilities.
#
# USAGE:
# ------
# Original (this file): python Engine.py
# Refactored: from backend import run_development_server; run_development_server()
#
# For more details, see: REFACTORING_SUMMARY.md
# ================================================================================================
#
####################################################################################################
# STEP 1: SETUP & DATA INGESTION
# REFACTORED TO: backend/config.py, backend/database.py, backend/data_loader.py
####################################################################################################

print("="*80)
print("SEASONAL MEDICAL STORAGE RECOMMENDATION SYSTEM")
print("Phase 1: Core Seasonal Analytics Engine")
print("="*80 + "\n")

# 1.1 Import Necessary Libraries
print("Step 1.1: Installing and importing necessary libraries...")
print("-" * 80)

# Install required packages (for Google Colab)
import sys
import subprocess

def install_package(package):
    """Install a package using pip"""
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", package])

# Install packages
packages = ['pandas', 'numpy', 'matplotlib', 'seaborn', 'scikit-learn', 
            'statsmodels', 'prophet', 'openpyxl']

print("Installing required packages...")
for package in packages:
    try:
        install_package(package)
    except:
        print(f"Note: {package} may already be installed")

# Import libraries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json
import warnings
import os
from datetime import datetime, timedelta
from statsmodels.tsa.statespace.sarimax import SARIMAX
from prophet import Prophet

# Configure settings
warnings.filterwarnings('ignore')
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (14, 6)

print("✓ All libraries imported successfully.\n")

# Ensure output directory exists
os.makedirs('output', exist_ok=True)
print("✓ Output directory ensured: 'output/'\n")

####################################################################################################
# STEP 1.2: DATA LOADING FUNCTION
####################################################################################################

def load_sales_data(file_path, required_columns=None):
    """
    Loads sales data from a CSV file and performs comprehensive validation.
    
    Args:
        file_path (str): The path to the .csv file.
        required_columns (list): A list of column names that must be in the CSV.
    
    Returns:
        pandas.DataFrame: The loaded and validated DataFrame, or None if validation fails.
    """
    print("\n" + "="*80)
    print("STEP 1.2: DATA LOADING & VALIDATION")
    print("="*80)
    
    if required_columns is None:
        required_columns = [
            'date', 'time', 'invoice_id', 'medicine_name', 'generic_name',
            'brand', 'manufacturer', 'supplier', 'dosage_form', 'strength',
            'category', 'prescription_required', 'quantity', 'unit_price'
        ]
    
    print(f"\nLoading data from: '{file_path}'...")
    
    try:
        # Read CSV file
        df = pd.read_csv(file_path)
        print(f"✓ Data loaded successfully")
        print(f"  - Total records: {df.shape[0]:,}")
        print(f"  - Total columns: {df.shape[1]}")
        
        # Validate required columns
        missing_columns = set(required_columns) - set(df.columns)
        if missing_columns:
            print(f"\n✗ Error: Missing required columns: {missing_columns}")
            print(f"  Required: {required_columns}")
            print(f"  Found: {df.columns.tolist()}")
            return None
        
        print(f"✓ All required columns present")
        
        # Display data preview
        print(f"\nData Preview (first 3 rows):")
        print(df.head(3))
        
        # Display basic statistics
        print(f"\nBasic Statistics:")
        print(f"  - Date range: {df['date'].min()} to {df['date'].max()}")
        print(f"  - Unique medicines: {df['medicine_name'].nunique():,}")
        print(f"  - Unique invoices: {df['invoice_id'].nunique():,}")
        
        return df
        
    except FileNotFoundError:
        print(f"\n✗ Error: File '{file_path}' not found.")
        print("  Please check the file path and try again.")
        return None
    except Exception as e:
        print(f"\n✗ Unexpected error occurred: {str(e)}")
        return None

####################################################################################################
# STEP 2: DATA PREPROCESSING & FEATURE ENGINEERING
# REFACTORED TO: backend/data_loader.py, backend/utils.py
####################################################################################################

def clean_data(df):
    """
    Performs comprehensive data cleaning operations on the DataFrame.
    
    Args:
        df (pandas.DataFrame): The input DataFrame.
    
    Returns:
        pandas.DataFrame: The cleaned DataFrame.
    """
    print("\n" + "="*80)
    print("STEP 2.1: DATA CLEANING")
    print("="*80)
    
    # Create a copy to avoid modifying original
    df_clean = df.copy()
    initial_rows = len(df_clean)
    
    # --- Check for Missing Values ---
    print("\n2.1.1: Checking for missing values...")
    print("-" * 80)
    missing_summary = df_clean.isnull().sum()
    missing_critical = missing_summary[missing_summary > 0]
    
    if len(missing_critical) > 0:
        print("Missing values found:")
        print(missing_critical)
    else:
        print("✓ No missing values detected")
    
    # --- Handle Missing Values in Critical Columns ---
    print("\n2.1.2: Handling missing values in critical columns...")
    print("-" * 80)
    critical_columns = ['date', 'medicine_name', 'quantity', 'unit_price']
    df_clean.dropna(subset=critical_columns, inplace=True)
    rows_dropped = initial_rows - len(df_clean)
    
    if rows_dropped > 0:
        print(f"✓ Removed {rows_dropped} rows with missing critical data")
        print(f"  Remaining records: {len(df_clean):,}")
    else:
        print("✓ No rows removed")
    
    # --- Correct Data Types ---
    print("\n2.1.3: Correcting data types...")
    print("-" * 80)
    
    # Convert date to datetime
    df_clean['date'] = pd.to_datetime(df_clean['date'], errors='coerce')
    print("✓ Date column converted to datetime")
    
    # Create datetime column by combining date and time
    try:
        df_clean['datetime'] = pd.to_datetime(
            df_clean['date'].astype(str) + ' ' + df_clean['time'].astype(str),
            errors='coerce'
        )
        print("✓ DateTime column created")
    except:
        df_clean['datetime'] = df_clean['date']
        print("⚠ Could not create datetime column, using date only")
    
    # Convert numeric columns
    df_clean['quantity'] = pd.to_numeric(df_clean['quantity'], errors='coerce')
    df_clean['unit_price'] = pd.to_numeric(df_clean['unit_price'], errors='coerce')
    print("✓ Numeric columns converted")
    
    # Remove rows that failed numeric conversion or have invalid quantities
    df_clean = df_clean.dropna(subset=['quantity', 'unit_price'])
    df_clean = df_clean[df_clean['quantity'] > 0]
    df_clean = df_clean[df_clean['unit_price'] > 0]
    
    final_rows = len(df_clean)
    total_removed = initial_rows - final_rows
    print(f"✓ Removed {total_removed} invalid/zero-value records")
    
    # Convert prescription_required to boolean
    if 'prescription_required' in df_clean.columns:
        df_clean['prescription_required'] = df_clean['prescription_required'].astype(int)
        print("✓ Prescription status converted")
    
    # --- Standardize Medicine Names ---
    print("\n2.1.4: Standardizing medicine and generic names...")
    print("-" * 80)
    
    df_clean['medicine_name_clean'] = (
        df_clean['medicine_name']
        .str.strip()
        .str.upper()
        .str.replace(r'\s+', ' ', regex=True)
    )
    
    df_clean['generic_name_clean'] = (
        df_clean['generic_name']
        .fillna('UNKNOWN')
        .str.strip()
        .str.upper()
        .str.replace(r'\s+', ' ', regex=True)
    )
    
    print(f"✓ Medicine names standardized")
    print(f"  Unique medicines after cleaning: {df_clean['medicine_name_clean'].nunique():,}")
    
    # --- Calculate Total Sales ---
    df_clean['total_sales'] = df_clean['quantity'] * df_clean['unit_price']
    print("✓ Total sales column calculated")
    
    # --- Display Summary ---
    print("\n" + "-" * 80)
    print("CLEANING SUMMARY:")
    print(f"  Initial records: {initial_rows:,}")
    print(f"  Final records: {final_rows:,}")
    print(f"  Records removed: {total_removed:,} ({total_removed/initial_rows*100:.2f}%)")
    print(f"  Data quality: {final_rows/initial_rows*100:.2f}%")
    
    print("\nDataFrame Info After Cleaning:")
    print("-" * 80)
    df_clean.info()
    
    return df_clean


def create_features(df):
    """
    Creates new time-based and seasonal features from the cleaned data.
    
    Args:
        df (pandas.DataFrame): Cleaned DataFrame.
    
    Returns:
        pandas.DataFrame: DataFrame with engineered features.
    """
    print("\n" + "="*80)
    print("STEP 2.2: FEATURE ENGINEERING")
    print("="*80)
    
    df_features = df.copy()
    
    # --- Extract Time Components ---
    print("\n2.2.1: Extracting time-based features...")
    print("-" * 80)
    
    df_features['Year'] = df_features['date'].dt.year
    df_features['Month'] = df_features['date'].dt.month
    df_features['Day'] = df_features['date'].dt.day
    df_features['DayOfWeek'] = df_features['date'].dt.dayofweek
    df_features['WeekOfYear'] = df_features['date'].dt.isocalendar().week
    df_features['Quarter'] = df_features['date'].dt.quarter
    
    print("✓ Time features extracted: Year, Month, Day, DayOfWeek, WeekOfYear, Quarter")
    
    # --- Map Seasons (Indian Climate) ---
    print("\n2.2.2: Mapping seasonal features...")
    print("-" * 80)
    
    def get_season(month):
        """Map month to season based on Indian climate"""
        if month in [2, 3, 4, 5]:
            return 'Summer'
        elif month in [6, 7, 8, 9]:
            return 'Monsoon'
        else:  # [10, 11, 12, 1]
            return 'Winter'
    
    df_features['Season'] = df_features['Month'].apply(get_season)
    df_features['Season_Year'] = df_features['Season'] + ' ' + df_features['Year'].astype(str)
    
    print("✓ Seasonal features created")
    print("\nSeason Distribution:")
    season_counts = df_features['Season'].value_counts().sort_index()
    for season, count in season_counts.items():
        print(f"  {season}: {count:,} records ({count/len(df_features)*100:.1f}%)")
    
    print("\nDate Range by Season:")
    print("-" * 80)
    season_ranges = df_features.groupby('Season')['date'].agg(['min', 'max'])
    print(season_ranges)
    
    print("\n✓ Feature engineering completed successfully")
    
    return df_features


def create_medicine_master(df, save_file=True):
    """
    Creates a comprehensive master list of medicines with aggregated information.
    
    Args:
        df (pandas.DataFrame): Feature-engineered DataFrame.
        save_file (bool): Whether to save the master list to CSV.
    
    Returns:
        pandas.DataFrame: Medicine master list.
    """
    print("\n" + "="*80)
    print("STEP 2.3: CREATING MEDICINE MASTER LIST")
    print("="*80)
    
    # Group by medicine and aggregate information
    medicine_master = df.groupby('medicine_name_clean').agg({
        'generic_name_clean': lambda x: ', '.join(x.unique()),
        'category': lambda x: x.mode()[0] if len(x.mode()) > 0 else 'Unknown',
        'dosage_form': lambda x: x.mode()[0] if len(x.mode()) > 0 else 'Unknown',
        'strength': lambda x: x.mode()[0] if len(x.mode()) > 0 else 'Unknown',
        'manufacturer': lambda x: x.mode()[0] if len(x.mode()) > 0 else 'Unknown',
        'quantity': 'sum',
        'total_sales': 'sum',
        'unit_price': 'mean',
        'invoice_id': 'nunique'
    }).reset_index()
    
    medicine_master.columns = [
        'medicine_name', 'generic_names', 'primary_category', 'primary_dosage_form',
        'primary_strength', 'primary_manufacturer', 'total_quantity_sold',
        'total_revenue_INR', 'avg_unit_price_INR', 'unique_orders'
    ]
    
    # Sort by total quantity sold
    medicine_master = medicine_master.sort_values(
        'total_quantity_sold', ascending=False
    ).reset_index(drop=True)
    
    # Add rank
    medicine_master['rank'] = range(1, len(medicine_master) + 1)
    
    print(f"✓ Medicine master list created")
    print(f"  Total unique medicines: {len(medicine_master):,}")
    print(f"\nTop 10 Medicines by Volume:")
    print("-" * 80)
    print(medicine_master.head(10)[['rank', 'medicine_name', 'total_quantity_sold', 'total_revenue_INR']])
    
    # Save to CSV
    if save_file:
        filename = 'output/medicine_master_list.csv'
        medicine_master.to_csv(filename, index=False)
        print(f"\n✓ Master list saved to: '{filename}'")
    
    return medicine_master

####################################################################################################
# STEP 3: EXPLORATORY DATA ANALYSIS (EDA)
# REFACTORED TO: backend/analyzer.py (SeasonalAnalyzer class)
####################################################################################################

def perform_eda(df):
    """
    Performs comprehensive exploratory data analysis with visualizations.
    
    Args:
        df (pandas.DataFrame): Feature-engineered DataFrame.
    
    Returns:
        dict: EDA results and statistics.
    """
    print("\n" + "="*80)
    print("STEP 3: EXPLORATORY DATA ANALYSIS (EDA)")
    print("="*80)
    
    # --- 3.1: Seasonal Sales Analysis ---
    print("\n3.1: Analyzing seasonal sales patterns...")
    print("-" * 80)
    
    seasonal_sales = df.groupby('Season').agg({
        'quantity': 'sum',
        'total_sales': 'sum',
        'invoice_id': 'nunique',
        'medicine_name_clean': 'nunique'
    }).reindex(['Summer', 'Monsoon', 'Winter'])
    
    seasonal_sales.columns = ['Total_Quantity', 'Total_Revenue_INR', 'Unique_Invoices', 'Unique_Medicines']
    
    print("\nSeasonal Performance Summary:")
    print(seasonal_sales)
    
    # Visualization: Seasonal Sales Overview
    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    
    seasons_order = ['Summer', 'Monsoon', 'Winter']
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1']
    
    # Subplot 1: Quantity by Season
    ax1 = axes[0]
    seasonal_qty = seasonal_sales.loc[seasons_order, 'Total_Quantity']
    bars1 = ax1.bar(seasons_order, seasonal_qty, color=colors, edgecolor='black', linewidth=1.5)
    ax1.set_xlabel('Season', fontsize=13, fontweight='bold')
    ax1.set_ylabel('Total Quantity Sold', fontsize=13, fontweight='bold')
    ax1.set_title('Total Medicine Quantity Sold by Season', fontsize=15, fontweight='bold')
    ax1.grid(axis='y', alpha=0.3)
    
    # Add value labels
    for bar in bars1:
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height):,}',
                ha='center', va='bottom', fontweight='bold', fontsize=11)
    
    # Subplot 2: Revenue by Season
    ax2 = axes[1]
    seasonal_rev = seasonal_sales.loc[seasons_order, 'Total_Revenue_INR']
    bars2 = ax2.bar(seasons_order, seasonal_rev, color=colors, edgecolor='black', linewidth=1.5)
    ax2.set_xlabel('Season', fontsize=13, fontweight='bold')
    ax2.set_ylabel('Total Revenue (INR)', fontsize=13, fontweight='bold')
    ax2.set_title('Total Revenue by Season', fontsize=15, fontweight='bold')
    ax2.grid(axis='y', alpha=0.3)
    
    # Add value labels
    for bar in bars2:
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height,
                f'₹{int(height):,}',
                ha='center', va='bottom', fontweight='bold', fontsize=10)
    
    plt.tight_layout()
    plt.savefig('output/01_seasonal_sales_overview.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("✓ Chart saved: 'output/01_seasonal_sales_overview.png'")
    
    # --- 3.2: Top Medicine Identification ---
    print("\n3.2: Identifying top 10 selling medicines for each season...")
    print("-" * 80)
    
    fig, axes = plt.subplots(1, 3, figsize=(22, 7))
    fig.suptitle('Top 10 Best-Selling Medicines by Season', fontsize=18, fontweight='bold')
    
    for i, season in enumerate(seasons_order):
        ax = axes[i]
        top_10 = df[df['Season'] == season].groupby('medicine_name_clean')['quantity'].sum().nlargest(10)
        
        # Create horizontal bar chart
        y_pos = np.arange(len(top_10))
        bars = ax.barh(y_pos, top_10.values, color=colors[i], edgecolor='black', linewidth=1)
        ax.set_yticks(y_pos)
        ax.set_yticklabels([name[:35] + '...' if len(name) > 35 else name for name in top_10.index], fontsize=9)
        ax.invert_yaxis()
        ax.set_xlabel('Total Quantity Sold', fontsize=11, fontweight='bold')
        ax.set_title(f'Top 10 in {season}', fontsize=13, fontweight='bold')
        ax.grid(axis='x', alpha=0.3)
        
        # Add value labels
        for j, bar in enumerate(bars):
            width = bar.get_width()
            ax.text(width, bar.get_y() + bar.get_height()/2.,
                   f' {int(width):,}',
                   ha='left', va='center', fontsize=9, fontweight='bold')
        
        print(f"\n{season} - Top 5:")
        for idx, (med, qty) in enumerate(top_10.head(5).items(), 1):
            print(f"  {idx}. {med[:50]}: {int(qty):,} units")
    
    plt.tight_layout(rect=[0, 0.03, 1, 0.96])
    plt.savefig('output/02_top_medicines_by_season.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("\n✓ Chart saved: 'output/02_top_medicines_by_season.png'")
    
    # --- 3.3: Trend Analysis ---
    print("\n3.3: Plotting sales trends for high-volume medicines...")
    print("-" * 80)
    
    # Get top 3 medicines
    top_medicines = df.groupby('medicine_name_clean')['quantity'].sum().nlargest(3)
    
    fig, axes = plt.subplots(len(top_medicines), 1, figsize=(16, 5*len(top_medicines)))
    if len(top_medicines) == 1:
        axes = [axes]
    
    for idx, (medicine, total_qty) in enumerate(top_medicines.items()):
        ax = axes[idx]
        
        # Get medicine data and resample by week
        med_data = df[df['medicine_name_clean'] == medicine]
        weekly_sales = med_data.set_index('date')['quantity'].resample('W-Mon').sum()
        
        # Plot trend line
        ax.plot(weekly_sales.index, weekly_sales.values, 
               marker='o', markersize=5, linestyle='-', linewidth=2, color='#2C3E50')
        
        # Add seasonal background shading
        for year in weekly_sales.index.year.unique():
            # Summer (Feb-May)
            ax.axvspan(pd.Timestamp(f'{year}-02-01'), pd.Timestamp(f'{year}-05-31'),
                      alpha=0.15, color='#FF6B6B', label='Summer' if idx == 0 and year == weekly_sales.index.year.min() else '')
            # Monsoon (Jun-Sep)
            ax.axvspan(pd.Timestamp(f'{year}-06-01'), pd.Timestamp(f'{year}-09-30'),
                      alpha=0.15, color='#4ECDC4', label='Monsoon' if idx == 0 and year == weekly_sales.index.year.min() else '')
            # Winter (Oct-Dec)
            ax.axvspan(pd.Timestamp(f'{year}-10-01'), pd.Timestamp(f'{year}-12-31'),
                      alpha=0.15, color='#45B7D1', label='Winter' if idx == 0 and year == weekly_sales.index.year.min() else '')
        
        ax.set_xlabel('Date', fontsize=11, fontweight='bold')
        ax.set_ylabel('Weekly Quantity Sold', fontsize=11, fontweight='bold')
        title = medicine[:60] + '...' if len(medicine) > 60 else medicine
        ax.set_title(f'Weekly Sales Trend: {title}\n(Total: {int(total_qty):,} units)', 
                    fontsize=12, fontweight='bold')
        ax.grid(True, alpha=0.3)
        
        if idx == 0:
            ax.legend(loc='upper left', fontsize=10)
        
        print(f"  {idx+1}. {medicine[:50]}: {int(total_qty):,} units")
    
    plt.tight_layout()
    plt.savefig('output/03_medicine_trends_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()
    print("\n✓ Chart saved: 'output/03_medicine_trends_analysis.png'")
    
    print("\n✓ EDA completed successfully\n")
    
    return seasonal_sales.to_dict()

####################################################################################################
# STEP 4: PREDICTIVE RECOMMENDATION MODELS
# REFACTORED TO: backend/analyzer.py (RecommendationEngine, ForecastingEngine classes)
####################################################################################################

def get_heuristic_recommendations(df, target_season, buffer=0.15):
    """
    Generates stock recommendations based on historical seasonal data with statistical buffer.
    
    Args:
        df (pandas.DataFrame): Feature-engineered DataFrame.
        target_season (str): Season to generate recommendations for ('Summer', 'Monsoon', 'Winter').
        buffer (float): Safety stock buffer percentage (default: 0.15 = 15%).
    
    Returns:
        pandas.DataFrame: Recommendations with rankings and suggested stock quantities.
    """
    print("\n" + "="*80)
    print(f"STEP 4.1: HEURISTIC RECOMMENDATIONS FOR '{target_season.upper()}'")
    print("="*80)
    
    # Filter data for the target season
    season_data = df[df['Season'] == target_season]
    
    if season_data.empty:
        print(f"✗ Error: No historical data available for season '{target_season}'")
        return pd.DataFrame()
    
    print(f"\nAnalyzing historical data for {target_season}:")
    print(f"  Date range: {season_data['date'].min()} to {season_data['date'].max()}")
    print(f"  Total records: {len(season_data):,}")
    print(f"  Unique medicines: {season_data['medicine_name_clean'].nunique():,}")
    
    # Aggregate sales by medicine
    recommendations = season_data.groupby('medicine_name_clean').agg({
        'quantity': 'sum',
        'total_sales': 'sum',
        'invoice_id': 'nunique',
        'unit_price': 'mean'
    }).reset_index()
    
    recommendations.columns = [
        'medicine_name', 'last_season_sales', 'total_revenue',
        'unique_orders', 'avg_unit_price'
    ]
    
    # Calculate suggested stock quantity with buffer
    recommendations['suggested_stock_quantity'] = (
        recommendations['last_season_sales'] * (1 + buffer)
    ).astype(int)
    
    # Calculate daily average (assuming ~90 days per season)
    days_in_season = (season_data['date'].max() - season_data['date'].min()).days
    if days_in_season == 0:
        days_in_season = 90
    
    recommendations['daily_avg_sales'] = (
        recommendations['last_season_sales'] / days_in_season
    ).round(2)
    
    # Sort by sales volume and add rank
    recommendations = recommendations.sort_values('last_season_sales', ascending=False).reset_index(drop=True)
    recommendations['rank'] = range(1, len(recommendations) + 1)
    
    # Identify fast movers (top 25th percentile)
    fast_mover_threshold = recommendations['daily_avg_sales'].quantile(0.75)
    recommendations['is_fast_mover'] = recommendations['daily_avg_sales'] >= fast_mover_threshold
    
    # Display top 20
    top_20 = recommendations.head(20)
    
    print(f"\n✓ Recommendations generated for {len(recommendations):,} medicines")
    print(f"✓ Fast movers identified: {recommendations['is_fast_mover'].sum()}")
    print(f"✓ Buffer percentage applied: {buffer*100}%")
    
    print(f"\nTop 20 Recommendations for {target_season}:")
    print("-" * 80)
    print(top_20[['rank', 'medicine_name', 'last_season_sales', 'suggested_stock_quantity', 'daily_avg_sales']].to_string(index=False))
    
    return recommendations[['rank', 'medicine_name', 'last_season_sales', 'suggested_stock_quantity', 
                           'daily_avg_sales', 'total_revenue', 'avg_unit_price', 'unique_orders', 'is_fast_mover']]


def get_timeseries_forecast_sarima(df, medicine_name, forecast_weeks=12):
    """
    Generates sales forecast using SARIMA (Seasonal ARIMA) model.
    
    Args:
        df (pandas.DataFrame): Feature-engineered DataFrame.
        medicine_name (str): Medicine to forecast.
        forecast_weeks (int): Number of weeks to forecast (default: 12).
    
    Returns:
        pandas.DataFrame: Forecast results.
    """
    print("\n" + "="*80)
    print(f"STEP 4.2: SARIMA TIME-SERIES FORECAST")
    print("="*80)
    
    med_name_short = medicine_name[:50] + '...' if len(medicine_name) > 50 else medicine_name
    print(f"\nForecasting for: {med_name_short}")
    print("-" * 80)
    
    # Filter and prepare time series data
    med_data = df[df['medicine_name_clean'] == medicine_name]
    
    if med_data.empty:
        print(f"✗ Error: No data found for medicine '{medicine_name}'")
        return None
    
    # Resample to weekly data
    ts_data = med_data.set_index('date')['quantity'].resample('W-Mon').sum()
    
    print(f"Time series prepared:")
    print(f"  Total weeks: {len(ts_data)}")
    print(f"  Date range: {ts_data.index.min()} to {ts_data.index.max()}")
    print(f"  Average weekly sales: {ts_data.mean():.2f}")
    
    if len(ts_data) < 24:
        print(f"\n⚠ Warning: Insufficient data ({len(ts_data)} weeks) for reliable SARIMA forecast.")
        print("  Minimum 24 weeks recommended. Skipping forecast.")
        return None
    
    # Fit SARIMA model
    print(f"\nFitting SARIMA model...")
    try:
        model = SARIMAX(
            ts_data, 
            order=(1, 1, 1),
            seasonal_order=(1, 1, 0, 12),
            enforce_stationarity=False,
            enforce_invertibility=False
        ).fit(disp=False)
        
        print("✓ Model fitted successfully")
        
        # Generate forecast
        forecast = model.get_forecast(steps=forecast_weeks)
        forecast_mean = forecast.predicted_mean
        forecast_ci = forecast.conf_int()
        
        # Create visualization
        plt.figure(figsize=(16, 7))
        ax = plt.gca()
        
        # Plot historical data
        ax.plot(ts_data.index, ts_data.values, 
               label='Historical Sales', marker='o', markersize=4, linewidth=2, color='#2C3E50')
        
        # Plot forecast
        ax.plot(forecast_mean.index, forecast_mean.values,
               label='Forecast', marker='s', markersize=4, linewidth=2, 
               color='#E74C3C', linestyle='--')
        
        # Plot confidence interval
        ax.fill_between(forecast_ci.index, 
                       forecast_ci.iloc[:, 0], 
                       forecast_ci.iloc[:, 1],
                       alpha=0.3, color='#E74C3C', label='95% Confidence Interval')
        
        # Add vertical line at forecast start
        ax.axvline(ts_data.index[-1], color='green', linestyle='--', 
                  linewidth=2, label='Forecast Start')
        
        ax.set_xlabel('Date', fontsize=12, fontweight='bold')
        ax.set_ylabel('Weekly Quantity Sold', fontsize=12, fontweight='bold')
        ax.set_title(f'SARIMA Forecast: {med_name_short}\n({forecast_weeks} weeks ahead)', 
                    fontsize=14, fontweight='bold')
        ax.legend(loc='best', fontsize=10)
        ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        safe_name = medicine_name[:30].replace('/', '_').replace('\\', '_').replace(' ', '_')
        plt.savefig(f'output/04_sarima_forecast_{safe_name}.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print(f"✓ Chart saved: 'output/04_sarima_forecast_{safe_name}.png'")
        
        # Display forecast summary
        print(f"\nForecast Summary (Next {forecast_weeks} weeks):")
        print("-" * 80)
        forecast_df = pd.DataFrame({
            'Week_Ending': forecast_mean.index,
            'Predicted_Quantity': forecast_mean.values.round(0).astype(int),
            'Lower_Bound': forecast_ci.iloc[:, 0].values.round(0).astype(int),
            'Upper_Bound': forecast_ci.iloc[:, 1].values.round(0).astype(int)
        })
        print(forecast_df.to_string(index=False))
        
        total_forecast = forecast_mean.sum()
        print(f"\nTotal predicted demand for next {forecast_weeks} weeks: {int(total_forecast):,} units")
        
        return forecast_df
        
    except Exception as e:
        print(f"✗ Error during SARIMA forecasting: {str(e)}")
        return None


def get_timeseries_forecast_prophet(df, medicine_name, forecast_months=3):
    """
    Generates sales forecast using Facebook Prophet model.
    
    Args:
        df (pandas.DataFrame): Feature-engineered DataFrame.
        medicine_name (str): Medicine to forecast.
        forecast_months (int): Number of months to forecast (default: 3).
    
    Returns:
        pandas.DataFrame: Forecast results.
    """
    print("\n" + "="*80)
    print(f"STEP 4.3: PROPHET TIME-SERIES FORECAST")
    print("="*80)
    
    med_name_short = medicine_name[:50] + '...' if len(medicine_name) > 50 else medicine_name
    print(f"\nForecasting for: {med_name_short}")
    print("-" * 80)
    
    # Filter medicine data
    med_data = df[df['medicine_name_clean'] == medicine_name].copy()
    
    if med_data.empty:
        print(f"✗ Error: No data found for medicine '{medicine_name}'")
        return None
    
    # Prepare data for Prophet (requires 'ds' and 'y' columns)
    daily_sales = med_data.groupby('date')['quantity'].sum().reset_index()
    daily_sales.columns = ['ds', 'y']
    
    print(f"Time series prepared:")
    print(f"  Total days: {len(daily_sales)}")
    print(f"  Date range: {daily_sales['ds'].min()} to {daily_sales['ds'].max()}")
    print(f"  Average daily sales: {daily_sales['y'].mean():.2f}")
    
    if len(daily_sales) < 30:
        print(f"\n⚠ Warning: Insufficient data ({len(daily_sales)} days) for reliable Prophet forecast.")
        print("  Minimum 30 days recommended. Skipping forecast.")
        return None
    
    # Fit Prophet model
    print(f"\nFitting Prophet model...")
    try:
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            seasonality_mode='multiplicative',
            interval_width=0.95
        )
        
        model.fit(daily_sales)
        print("✓ Model fitted successfully")
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=forecast_months*30, freq='D')
        forecast = model.predict(future)
        
        # Create visualization
        fig, axes = plt.subplots(2, 1, figsize=(16, 10))
        
        # Plot 1: Forecast Overview
        ax1 = axes[0]
        ax1.plot(daily_sales['ds'], daily_sales['y'], 
                'ko', markersize=3, label='Actual Sales', alpha=0.5)
        ax1.plot(forecast['ds'], forecast['yhat'], 
                'b-', linewidth=2, label='Forecast')
        ax1.fill_between(forecast['ds'], 
                        forecast['yhat_lower'], 
                        forecast['yhat_upper'],
                        alpha=0.3, color='blue', label='Uncertainty Interval')
        ax1.axvline(daily_sales['ds'].max(), color='red', linestyle='--', 
                   linewidth=2, label='Forecast Start')
        ax1.set_xlabel('Date', fontsize=11, fontweight='bold')
        ax1.set_ylabel('Daily Quantity', fontsize=11, fontweight='bold')
        ax1.set_title(f'Prophet Forecast: {med_name_short}', 
                     fontsize=13, fontweight='bold')
        ax1.legend(loc='best', fontsize=9)
        ax1.grid(True, alpha=0.3)
        
        # Plot 2: Yearly Seasonality Component
        ax2 = axes[1]
        yearly_component = forecast[['ds', 'yearly']].copy()
        ax2.plot(yearly_component['ds'], yearly_component['yearly'], 
                linewidth=2, color='#E74C3C')
        ax2.set_xlabel('Date', fontsize=11, fontweight='bold')
        ax2.set_ylabel('Yearly Seasonality Effect', fontsize=11, fontweight='bold')
        ax2.set_title('Seasonal Pattern Analysis', fontsize=13, fontweight='bold')
        ax2.grid(True, alpha=0.3)
        ax2.axhline(y=0, color='black', linestyle='-', linewidth=0.8)
        
        plt.tight_layout()
        safe_name = medicine_name[:30].replace('/', '_').replace('\\', '_').replace(' ', '_')
        plt.savefig(f'output/05_prophet_forecast_{safe_name}.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print(f"✓ Chart saved: 'output/05_prophet_forecast_{safe_name}.png'")
        
        # Extract future forecast
        future_forecast = forecast[forecast['ds'] > daily_sales['ds'].max()].copy()
        future_forecast['month'] = future_forecast['ds'].dt.to_period('M')
        
        # Monthly aggregation
        monthly_forecast = future_forecast.groupby('month').agg({
            'yhat': 'sum',
            'yhat_lower': 'sum',
            'yhat_upper': 'sum'
        }).reset_index()
        
        monthly_forecast.columns = ['Month', 'Predicted_Quantity', 'Lower_Bound', 'Upper_Bound']
        monthly_forecast['Predicted_Quantity'] = monthly_forecast['Predicted_Quantity'].round(0).astype(int)
        monthly_forecast['Lower_Bound'] = monthly_forecast['Lower_Bound'].round(0).astype(int)
        monthly_forecast['Upper_Bound'] = monthly_forecast['Upper_Bound'].round(0).astype(int)
        
        print(f"\nMonthly Forecast Summary:")
        print("-" * 80)
        print(monthly_forecast.to_string(index=False))
        
        total_forecast = monthly_forecast['Predicted_Quantity'].sum()
        print(f"\nTotal predicted demand for next {forecast_months} months: {int(total_forecast):,} units")
        
        return monthly_forecast
        
    except Exception as e:
        print(f"✗ Error during Prophet forecasting: {str(e)}")
        return None

####################################################################################################
# STEP 5: STRUCTURING THE FINAL OUTPUT
# REFACTORED TO: backend/analyzer.py (VisualizationEngine class), backend/routes.py (API endpoints)
####################################################################################################

def get_season_timing(season):
    """
    Get the month range and order timing for a season.
    
    Args:
        season (str): Season name
    
    Returns:
        dict: Season timing information
    """
    season_info = {
        'Summer': {
            'months': 'February to May',
            'month_numbers': [2, 3, 4, 5],
            'order_before': 'Late January',
            'peak_months': 'March-April',
            'duration_days': 120
        },
        'Monsoon': {
            'months': 'June to September',
            'month_numbers': [6, 7, 8, 9],
            'order_before': 'Late May',
            'peak_months': 'July-August',
            'duration_days': 120
        },
        'Winter': {
            'months': 'October to January',
            'month_numbers': [10, 11, 12, 1],
            'order_before': 'Late September',
            'peak_months': 'November-December',
            'duration_days': 120
        }
    }
    return season_info.get(season, {})


def categorize_medicines_by_priority(recommendations_df):
    """
    Categorize medicines into priority levels for ordering.
    
    Args:
        recommendations_df (pandas.DataFrame): Recommendations DataFrame
    
    Returns:
        dict: Categorized medicines by priority
    """
    if recommendations_df.empty:
        return {}
    
    # Calculate percentile thresholds
    total_medicines = len(recommendations_df)
    
    # Priority A: Top 20% (Critical - Must Stock)
    priority_a_count = max(int(total_medicines * 0.20), 1)
    priority_a = recommendations_df.head(priority_a_count).copy()
    priority_a['priority_level'] = 'CRITICAL'
    priority_a['action'] = 'MUST ORDER IMMEDIATELY'
    
    # Priority B: Next 30% (High Priority - Recommended)
    priority_b_count = max(int(total_medicines * 0.30), 1)
    priority_b = recommendations_df.iloc[priority_a_count:priority_a_count+priority_b_count].copy()
    priority_b['priority_level'] = 'HIGH'
    priority_b['action'] = 'ORDER RECOMMENDED'
    
    # Priority C: Next 30% (Medium Priority - Optional)
    priority_c_count = max(int(total_medicines * 0.30), 1)
    priority_c = recommendations_df.iloc[priority_a_count+priority_b_count:priority_a_count+priority_b_count+priority_c_count].copy()
    priority_c['priority_level'] = 'MEDIUM'
    priority_c['action'] = 'ORDER IF BUDGET ALLOWS'
    
    # Priority D: Remaining 20% (Low Priority)
    priority_d = recommendations_df.iloc[priority_a_count+priority_b_count+priority_c_count:].copy()
    priority_d['priority_level'] = 'LOW'
    priority_d['action'] = 'STOCK ON DEMAND'
    
    return {
        'CRITICAL': priority_a,
        'HIGH': priority_b,
        'MEDIUM': priority_c,
        'LOW': priority_d
    }


def generate_ordering_calendar(target_season, recommendations_df):
    """
    Generate a week-by-week ordering calendar for the season.
    
    Args:
        target_season (str): Target season
        recommendations_df (pandas.DataFrame): Recommendations DataFrame
    
    Returns:
        pandas.DataFrame: Ordering calendar
    """
    season_info = get_season_timing(target_season)
    
    # Create ordering schedule
    ordering_schedule = []
    
    # Week 1-2: Order Critical items
    critical_items = recommendations_df[recommendations_df['is_fast_mover'] == True].head(10)
    ordering_schedule.append({
        'week': '1-2 (Early Season)',
        'action': 'ORDER CRITICAL FAST-MOVERS',
        'medicines_count': len(critical_items),
        'total_quantity': int(critical_items['suggested_stock_quantity'].sum()),
        'estimated_cost_INR': float(critical_items['total_revenue'].sum()),
        'priority': 'URGENT'
    })
    
    # Week 3-4: Order High Priority items
    high_priority = recommendations_df.iloc[10:30]
    ordering_schedule.append({
        'week': '3-4 (Pre-Peak)',
        'action': 'ORDER HIGH PRIORITY ITEMS',
        'medicines_count': len(high_priority),
        'total_quantity': int(high_priority['suggested_stock_quantity'].sum()),
        'estimated_cost_INR': float(high_priority['total_revenue'].sum()),
        'priority': 'HIGH'
    })
    
    # Week 5-8: Order Medium Priority items
    medium_priority = recommendations_df.iloc[30:60]
    ordering_schedule.append({
        'week': '5-8 (Mid-Season)',
        'action': 'ORDER MEDIUM PRIORITY ITEMS',
        'medicines_count': len(medium_priority),
        'total_quantity': int(medium_priority['suggested_stock_quantity'].sum()),
        'estimated_cost_INR': float(medium_priority['total_revenue'].sum()),
        'priority': 'MEDIUM'
    })
    
    # Week 9-12: Restock Fast Movers
    ordering_schedule.append({
        'week': '9-12 (Peak Season)',
        'action': 'RESTOCK FAST-MOVING ITEMS',
        'medicines_count': len(critical_items),
        'total_quantity': int(critical_items['suggested_stock_quantity'].sum() * 0.5),
        'estimated_cost_INR': float(critical_items['total_revenue'].sum() * 0.5),
        'priority': 'RESTOCK'
    })
    
    return pd.DataFrame(ordering_schedule)


def generate_actionable_insights(recommendations_df, target_season):
    """
    Generate human-readable, actionable insights for pharmacy management.
    
    Args:
        recommendations_df (pandas.DataFrame): Recommendations DataFrame
        target_season (str): Target season
    
    Returns:
        dict: Actionable insights
    """
    season_info = get_season_timing(target_season)
    prioritized = categorize_medicines_by_priority(recommendations_df)
    
    insights = {
        'season_overview': {
            'season': target_season,
            'duration': season_info.get('months', 'N/A'),
            'order_deadline': season_info.get('order_before', 'N/A'),
            'peak_period': season_info.get('peak_months', 'N/A')
        },
        'immediate_actions': [],
        'critical_medicines': [],
        'budget_allocation': {},
        'inventory_alerts': [],
        'supplier_coordination': []
    }
    
    # Critical medicines to order immediately
    if 'CRITICAL' in prioritized:
        critical = prioritized['CRITICAL']
        for _, row in critical.head(10).iterrows():
            insights['critical_medicines'].append({
                'medicine': row['medicine_name'],
                'order_quantity': int(row['suggested_stock_quantity']),
                'estimated_cost': f"₹{row['total_revenue']:,.2f}",
                'urgency': 'ORDER NOW - Expected high demand',
                'daily_requirement': f"{row['daily_avg_sales']:.1f} units/day"
            })
    
    # Immediate actions
    insights['immediate_actions'] = [
        f"⚠️ URGENT: Order {len(prioritized.get('CRITICAL', []))} critical medicines before {season_info.get('order_before')}",
        f"📦 Prepare storage space for ~{recommendations_df['suggested_stock_quantity'].sum():,.0f} units",
        f"💰 Allocate budget: ₹{recommendations_df['total_revenue'].sum():,.2f} for complete stock",
        f"🔄 Set up supplier coordination for {len(recommendations_df[recommendations_df['is_fast_mover']==True])} fast-moving items",
        f"📊 Monitor stock levels daily during {season_info.get('peak_months')} peak period"
    ]
    
    # Budget allocation by priority
    for priority_level, priority_df in prioritized.items():
        if not priority_df.empty:
            insights['budget_allocation'][priority_level] = {
                'medicines_count': len(priority_df),
                'total_units': int(priority_df['suggested_stock_quantity'].sum()),
                'estimated_budget_INR': float(priority_df['total_revenue'].sum()),
                'percentage_of_total': round(priority_df['total_revenue'].sum() / recommendations_df['total_revenue'].sum() * 100, 1)
            }
    
    # Inventory alerts
    fast_movers = recommendations_df[recommendations_df['is_fast_mover'] == True]
    for _, row in fast_movers.head(5).iterrows():
        days_stock = row['suggested_stock_quantity'] / row['daily_avg_sales'] if row['daily_avg_sales'] > 0 else 0
        insights['inventory_alerts'].append({
            'medicine': row['medicine_name'],
            'alert': f"Stock will last ~{int(days_stock)} days - Setup auto-reorder",
            'reorder_point': int(row['daily_avg_sales'] * 7),  # 7 days buffer
            'reorder_quantity': int(row['suggested_stock_quantity'] * 0.5)
        })
    
    # Supplier coordination
    top_10 = recommendations_df.head(10)
    insights['supplier_coordination'] = [
        f"Contact suppliers for bulk orders of top 10 medicines",
        f"Negotiate prices for orders totaling ₹{top_10['total_revenue'].sum():,.2f}",
        f"Request express delivery for {len(fast_movers)} fast-moving items",
        f"Set up weekly delivery schedule during peak months"
    ]
    
    return insights


def generate_output_file(recommendations_df, target_season, file_name=None):
    """
    Generates comprehensive JSON and CSV output files with actionable recommendations.
    
    Args:
        recommendations_df (pandas.DataFrame): Recommendations DataFrame.
        target_season (str): Target season name.
        file_name (str): Optional custom filename (without extension).
    
    Returns:
        None
    """
    print("\n" + "="*80)
    print(f"STEP 5: GENERATING OUTPUT FILES FOR {target_season.upper()}")
    print("="*80)
    
    if recommendations_df.empty:
        print("✗ Cannot generate output file - recommendations DataFrame is empty")
        return
    
    # Generate filenames
    if file_name is None:
        file_name = f'output/recommendations_{target_season.lower()}'
    else:
        file_name = f'output/{file_name}'
    
    json_file = f'{file_name}.json'
    csv_file = f'{file_name}.csv'
    excel_file = f'{file_name}_detailed.xlsx'
    
    # Get season timing
    season_info = get_season_timing(target_season)
    
    # Prepare JSON structure
    generated_on_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_year = datetime.now().year
    
    # Get actionable insights
    insights = generate_actionable_insights(recommendations_df, target_season)
    
    # Categorize by priority
    prioritized = categorize_medicines_by_priority(recommendations_df)
    
    # Generate ordering calendar
    ordering_calendar = generate_ordering_calendar(target_season, recommendations_df)
    
    # Get top 20 for JSON
    top_20 = recommendations_df.head(20)
    
    # Get fast movers
    fast_movers = recommendations_df[
        recommendations_df['is_fast_mover'] == True
    ]['medicine_name'].head(10).tolist()
    
    # Calculate summary statistics
    total_medicines = len(recommendations_df)
    total_predicted_demand = int(recommendations_df['suggested_stock_quantity'].sum())
    total_revenue = float(recommendations_df['total_revenue'].sum())
    avg_daily_sales = float(recommendations_df['daily_avg_sales'].mean())
    
    # Create comprehensive JSON structure
    output_dict = {
        'recommendation_for_season': f"{target_season} {current_year}",
        'generated_on': generated_on_date,
        'season_information': {
            'season_name': target_season,
            'duration': season_info.get('months', 'N/A'),
            'order_by_date': season_info.get('order_before', 'N/A'),
            'peak_period': season_info.get('peak_months', 'N/A'),
            'estimated_duration_days': season_info.get('duration_days', 120)
        },
        'executive_summary': {
            'total_medicines_to_stock': total_medicines,
            'total_units_required': total_predicted_demand,
            'estimated_total_investment_INR': round(total_revenue, 2),
            'average_daily_sales_per_medicine': round(avg_daily_sales, 2),
            'critical_items_count': len(prioritized.get('CRITICAL', [])),
            'fast_movers_count': len(fast_movers),
            'buffer_percentage_applied': 15
        },
        'actionable_insights': insights,
        'ordering_calendar': ordering_calendar.to_dict('records'),
        'priority_categorization': {
            'CRITICAL': len(prioritized.get('CRITICAL', [])),
            'HIGH': len(prioritized.get('HIGH', [])),
            'MEDIUM': len(prioritized.get('MEDIUM', [])),
            'LOW': len(prioritized.get('LOW', []))
        },
        'top_20_must_order': [],
        'fast_movers_alert': fast_movers,
        'budget_breakdown': insights['budget_allocation'],
        'implementation_notes': [
            f"Start ordering {season_info.get('order_before', 'before season starts')}",
            'Prioritize CRITICAL items - order within 1 week',
            'HIGH priority items - order within 2-3 weeks',
            'MEDIUM priority items - order within 4-6 weeks',
            'Monitor fast-movers daily and restock as needed',
            'Keep 15% buffer stock for unexpected demand spikes',
            f"Peak demand expected during {season_info.get('peak_months', 'mid-season')}"
        ]
    }
    
    # Add top 20 recommendations with priority levels
    for _, row in top_20.iterrows():
        priority_level = 'CRITICAL' if row['rank'] <= len(prioritized.get('CRITICAL', [])) else 'HIGH'
        
        output_dict['top_20_must_order'].append({
            'rank': int(row['rank']),
            'medicine_name': row['medicine_name'],
            'order_quantity': int(row['suggested_stock_quantity']),
            'last_season_consumption': int(row['last_season_sales']),
            'estimated_cost_INR': float(row['total_revenue']),
            'daily_requirement': f"{row['daily_avg_sales']:.1f} units/day",
            'avg_unit_price_INR': float(row['avg_unit_price']),
            'unique_customers': int(row['unique_orders']),
            'priority_level': priority_level,
            'is_fast_mover': bool(row['is_fast_mover']),
            'action_required': 'ORDER IMMEDIATELY' if priority_level == 'CRITICAL' else 'ORDER SOON',
            'stock_duration_days': int(row['suggested_stock_quantity'] / row['daily_avg_sales']) if row['daily_avg_sales'] > 0 else 120
        })
    
    # Save JSON file
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(output_dict, f, indent=4, ensure_ascii=False)
    
    print(f"✓ JSON file created: '{json_file}'")
    
    # Save complete CSV file with priority levels
    recommendations_with_priority = recommendations_df.copy()
    recommendations_with_priority['priority_level'] = 'LOW'
    
    for priority_level, priority_df in prioritized.items():
        mask = recommendations_with_priority['medicine_name'].isin(priority_df['medicine_name'])
        recommendations_with_priority.loc[mask, 'priority_level'] = priority_level
        recommendations_with_priority.loc[mask, 'action'] = priority_df['action'].iloc[0]
    
    # Add stock duration
    recommendations_with_priority['stock_duration_days'] = (
        recommendations_with_priority['suggested_stock_quantity'] / 
        recommendations_with_priority['daily_avg_sales']
    ).fillna(120).astype(int)
    
    # Reorder columns for better readability
    column_order = [
        'rank', 'priority_level', 'medicine_name', 'suggested_stock_quantity',
        'last_season_sales', 'daily_avg_sales', 'stock_duration_days',
        'total_revenue', 'avg_unit_price', 'unique_orders', 'is_fast_mover', 'action'
    ]
    recommendations_with_priority = recommendations_with_priority[column_order]
    
    recommendations_with_priority.to_csv(csv_file, index=False)
    print(f"✓ CSV file created: '{csv_file}'")
    
    # Save detailed Excel file with multiple sheets
    try:
        with pd.ExcelWriter(excel_file, engine='openpyxl') as writer:
            # Sheet 1: All Recommendations
            recommendations_with_priority.to_excel(writer, sheet_name='All Medicines', index=False)
            
            # Sheet 2: Critical Items Only
            if 'CRITICAL' in prioritized:
                prioritized['CRITICAL'].to_excel(writer, sheet_name='Critical - Order Now', index=False)
            
            # Sheet 3: High Priority
            if 'HIGH' in prioritized:
                prioritized['HIGH'].to_excel(writer, sheet_name='High Priority', index=False)
            
            # Sheet 4: Ordering Calendar
            ordering_calendar.to_excel(writer, sheet_name='Ordering Schedule', index=False)
            
            # Sheet 5: Budget Summary
            budget_summary = pd.DataFrame([insights['budget_allocation']]).T.reset_index()
            budget_summary.columns = ['Priority Level', 'Details']
            budget_summary.to_excel(writer, sheet_name='Budget Allocation', index=False)
        
        print(f"✓ Excel file created: '{excel_file}' (with multiple sheets)")
    except Exception as e:
        print(f"⚠ Could not create Excel file: {str(e)}")
    
    # Display comprehensive summary
    print(f"\n" + "="*80)
    print(f"📋 {target_season.upper()} SEASON - ORDERING RECOMMENDATIONS")
    print("="*80)
    
    print(f"\n🗓️  SEASON TIMELINE:")
    print(f"  ├─ Duration: {season_info.get('months', 'N/A')}")
    print(f"  ├─ Order Deadline: {season_info.get('order_before', 'N/A')}")
    print(f"  └─ Peak Period: {season_info.get('peak_months', 'N/A')}")
    
    print(f"\n📊 INVENTORY REQUIREMENTS:")
    print(f"  ├─ Total Medicines: {total_medicines:,}")
    print(f"  ├─ Total Units Needed: {total_predicted_demand:,}")
    print(f"  ├─ Estimated Investment: ₹{total_revenue:,.2f}")
    print(f"  └─ Daily Avg Sales: {avg_daily_sales:.1f} units/medicine")
    
    print(f"\n🎯 PRIORITY BREAKDOWN:")
    for priority_level in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
        if priority_level in prioritized:
            count = len(prioritized[priority_level])
            budget = prioritized[priority_level]['total_revenue'].sum()
            pct = (budget / total_revenue * 100) if total_revenue > 0 else 0
            print(f"  ├─ {priority_level:8}: {count:3} medicines | ₹{budget:12,.2f} ({pct:5.1f}%)")
    
    print(f"\n🚨 CRITICAL ACTIONS REQUIRED:")
    for i, action in enumerate(insights['immediate_actions'], 1):
        print(f"  {i}. {action}")
    
    print(f"\n💊 TOP 5 MUST-ORDER MEDICINES:")
    for i, med in enumerate(output_dict['top_20_must_order'][:5], 1):
        print(f"  {i}. {med['medicine_name'][:50]}")
        print(f"     ├─ Order Quantity: {med['order_quantity']:,} units")
        print(f"     ├─ Estimated Cost: ₹{med['estimated_cost_INR']:,.2f}")
        print(f"     ├─ Daily Need: {med['daily_requirement']}")
        print(f"     └─ Priority: {med['priority_level']} - {med['action_required']}")
    
    print(f"\n📅 ORDERING CALENDAR:")
    for _, schedule in ordering_calendar.iterrows():
        print(f"  Week {schedule['week']}:")
        print(f"  ├─ Action: {schedule['action']}")
        print(f"  ├─ Medicines: {schedule['medicines_count']}")
        print(f"  ├─ Quantity: {schedule['total_quantity']:,} units")
        print(f"  └─ Budget: ₹{schedule['estimated_cost_INR']:,.2f}")
    
    print(f"\n📁 FILES GENERATED:")
    print(f"  ├─ {json_file} (Structured data with insights)")
    print(f"  ├─ {csv_file} (Complete list with priorities)")
    print(f"  └─ {excel_file} (Multi-sheet detailed report)")
    
    print("\n" + "="*80)

print("\n" + "="*80)


def create_actionable_dashboard(recommendations_df, target_season):
    """
    Create a visual dashboard showing actionable ordering insights.
    
    Args:
        recommendations_df (pandas.DataFrame): Recommendations DataFrame
        target_season (str): Target season
    
    Returns:
        None
    """
    print("\n" + "="*80)
    print(f"STEP 5.5: CREATING ACTIONABLE INSIGHTS DASHBOARD")
    print("="*80)
    
    prioritized = categorize_medicines_by_priority(recommendations_df)
    season_info = get_season_timing(target_season)
    
    fig = plt.figure(figsize=(18, 12))
    gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
    
    # 1. Priority Distribution (Pie Chart)
    ax1 = fig.add_subplot(gs[0, 0])
    priority_counts = {k: len(v) for k, v in prioritized.items()}
    colors_priority = ['#E74C3C', '#F39C12', '#3498DB', '#95A5A6']
    wedges, texts, autotexts = ax1.pie(
        priority_counts.values(),
        labels=priority_counts.keys(),
        colors=colors_priority,
        autopct='%1.1f%%',
        startangle=90
    )
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontweight('bold')
        autotext.set_fontsize(10)
    ax1.set_title('Medicine Priority Distribution', fontweight='bold', fontsize=11)
    
    # 2. Budget Allocation (Bar Chart)
    ax2 = fig.add_subplot(gs[0, 1:])
    budget_data = []
    for priority_level, priority_df in prioritized.items():
        if not priority_df.empty:
            budget_data.append({
                'Priority': priority_level,
                'Budget': priority_df['total_revenue'].sum(),
                'Medicines': len(priority_df)
            })
    budget_df = pd.DataFrame(budget_data)
    
    bars = ax2.barh(budget_df['Priority'], budget_df['Budget'], color=colors_priority)
    ax2.set_xlabel('Estimated Budget (INR)', fontweight='bold', fontsize=10)
    ax2.set_title('Budget Allocation by Priority Level', fontweight='bold', fontsize=11)
    
    for i, (bar, med_count) in enumerate(zip(bars, budget_df['Medicines'])):
        width = bar.get_width()
        ax2.text(width, bar.get_y() + bar.get_height()/2.,
                f' ₹{width:,.0f} ({med_count} meds)',
                ha='left', va='center', fontweight='bold', fontsize=9)
    
    # 3. Top 10 Critical Medicines (Horizontal Bar)
    ax3 = fig.add_subplot(gs[1, :])
    if 'CRITICAL' in prioritized:
        top_critical = prioritized['CRITICAL'].head(10)
        y_pos = np.arange(len(top_critical))
        
        bars = ax3.barh(y_pos, top_critical['suggested_stock_quantity'], color='#E74C3C', alpha=0.8)
        ax3.set_yticks(y_pos)
        ax3.set_yticklabels([name[:40] + '...' if len(name) > 40 else name 
                             for name in top_critical['medicine_name']], fontsize=9)
        ax3.invert_yaxis()
        ax3.set_xlabel('Suggested Order Quantity (Units)', fontweight='bold', fontsize=10)
        ax3.set_title('🚨 TOP 10 CRITICAL MEDICINES - ORDER IMMEDIATELY', 
                     fontweight='bold', fontsize=12, color='#E74C3C')
        ax3.grid(axis='x', alpha=0.3)
        
        for i, bar in enumerate(bars):
            width = bar.get_width()
            cost = top_critical.iloc[i]['total_revenue']
            ax3.text(width, bar.get_y() + bar.get_height()/2.,
                    f' {int(width):,} units (₹{cost:,.0f})',
                    ha='left', va='center', fontweight='bold', fontsize=8)
    
    # 4. Fast Movers Alert (Table)
    ax4 = fig.add_subplot(gs[2, 0])
    ax4.axis('off')
    fast_movers = recommendations_df[recommendations_df['is_fast_mover'] == True].head(5)
    
    table_data = []
    for _, row in fast_movers.iterrows():
        table_data.append([
            row['medicine_name'][:25] + '...' if len(row['medicine_name']) > 25 else row['medicine_name'],
            f"{row['daily_avg_sales']:.1f}/day"
        ])
    
    table = ax4.table(cellText=table_data,
                     colLabels=['Fast Mover', 'Daily Sales'],
                     cellLoc='left',
                     loc='center',
                     colWidths=[0.7, 0.3])
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1, 2)
    
    # Style header
    for i in range(2):
        table[(0, i)].set_facecolor('#E74C3C')
        table[(0, i)].set_text_props(weight='bold', color='white')
    
    ax4.set_title('⚡ FAST-MOVING ITEMS - DAILY MONITORING', 
                 fontweight='bold', fontsize=10, pad=20)
    
    # 5. Ordering Timeline (Text Summary)
    ax5 = fig.add_subplot(gs[2, 1:])
    ax5.axis('off')
    
    timeline_text = f"""
    📅 ORDERING TIMELINE FOR {target_season.upper()}
    
    Season Duration: {season_info.get('months', 'N/A')}
    Order Deadline: {season_info.get('order_before', 'N/A')}
    Peak Period: {season_info.get('peak_months', 'N/A')}
    
    ⏰ ACTION SCHEDULE:
    
    Week 1-2: Order {len(prioritized.get('CRITICAL', []))} CRITICAL medicines
              Budget: ₹{prioritized.get('CRITICAL', pd.DataFrame()).get('total_revenue', pd.Series([0])).sum():,.0f}
    
    Week 3-4: Order {len(prioritized.get('HIGH', []))} HIGH priority medicines
              Budget: ₹{prioritized.get('HIGH', pd.DataFrame()).get('total_revenue', pd.Series([0])).sum():,.0f}
    
    Week 5-8: Order {len(prioritized.get('MEDIUM', []))} MEDIUM priority medicines
              Budget: ₹{prioritized.get('MEDIUM', pd.DataFrame()).get('total_revenue', pd.Series([0])).sum():,.0f}
    
    Week 9+: Monitor and restock fast-movers as needed
    
    💡 TOTAL INVESTMENT: ₹{recommendations_df['total_revenue'].sum():,.2f}
    """
    
    ax5.text(0.05, 0.95, timeline_text, transform=ax5.transAxes,
            fontsize=9, verticalalignment='top', fontfamily='monospace',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.3))
    
    plt.suptitle(f'{target_season.upper()} SEASON - ACTIONABLE ORDERING DASHBOARD',
                fontsize=16, fontweight='bold', y=0.98)
    
    plt.savefig(f'output/06_actionable_dashboard_{target_season.lower()}.png', 
               dpi=300, bbox_inches='tight')
    plt.show()
    
    print(f"✓ Dashboard saved: 'output/06_actionable_dashboard_{target_season.lower()}.png'")


def generate_simple_ordering_guide(recommendations_df, target_season):
    """
    Generate a simple, printable ordering guide for pharmacy staff.
    
    Args:
        recommendations_df (pandas.DataFrame): Recommendations DataFrame
        target_season (str): Target season
    
    Returns:
        str: Formatted ordering guide
    """
    print("\n" + "="*80)
    print(f"STEP 5.6: GENERATING SIMPLE ORDERING GUIDE")
    print("="*80)
    
    prioritized = categorize_medicines_by_priority(recommendations_df)
    season_info = get_season_timing(target_season)
    
    guide = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    {target_season.upper()} SEASON ORDERING GUIDE                          ║
║                         Quick Reference Sheet                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📅 SEASON INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Duration        : {season_info.get('months', 'N/A')}
Order By        : {season_info.get('order_before', 'N/A')} ⚠️ DEADLINE
Peak Demand     : {season_info.get('peak_months', 'N/A')}
Total Budget    : ₹{recommendations_df['total_revenue'].sum():,.2f}

💰 BUDGET SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    for priority_level, priority_df in prioritized.items():
        if not priority_df.empty:
            budget = priority_df['total_revenue'].sum()
            count = len(priority_df)
            pct = (budget / recommendations_df['total_revenue'].sum() * 100)
            
            symbol = {
                'CRITICAL': '🚨',
                'HIGH': '⚠️',
                'MEDIUM': '📦',
                'LOW': '📋'
            }.get(priority_level, '📌')
            
            guide += f"{symbol} {priority_level:8} : {count:3} medicines | ₹{budget:12,.2f} ({pct:5.1f}%)\n"
    
    guide += f"""
🚨 CRITICAL MEDICINES - ORDER WITHIN 1 WEEK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rank  Medicine Name                                    Qty      Cost (INR)
────  ────────────────────────────────────────────────────────────────────────
"""
    
    if 'CRITICAL' in prioritized:
        for _, row in prioritized['CRITICAL'].head(15).iterrows():
            name = row['medicine_name'][:42].ljust(42)
            qty = f"{int(row['suggested_stock_quantity']):,}".rjust(8)
            cost = f"₹{row['total_revenue']:,.0f}".rjust(12)
            guide += f"{int(row['rank']):3}.  {name}  {qty}  {cost}\n"
    
    guide += f"""
⚡ FAST-MOVING ITEMS - DAILY MONITORING REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Medicine Name                                    Daily Avg    Reorder Point
────────────────────────────────────────────────────────────────────────────
"""
    
    fast_movers = recommendations_df[recommendations_df['is_fast_mover'] == True].head(10)
    for _, row in fast_movers.iterrows():
        name = row['medicine_name'][:42].ljust(42)
        daily = f"{row['daily_avg_sales']:.1f}".rjust(10)
        reorder = f"{int(row['daily_avg_sales'] * 7):,}".rjust(12)
        guide += f"{name}  {daily}  {reorder}\n"
    
    guide += f"""
📅 WEEK-BY-WEEK ORDERING SCHEDULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 1-2  : Order CRITICAL items ({len(prioritized.get('CRITICAL', []))})
            Budget: ₹{prioritized.get('CRITICAL', pd.DataFrame()).get('total_revenue', pd.Series([0])).sum():,.2f}
            Action: Contact suppliers, confirm delivery dates

Week 3-4  : Order HIGH priority items ({len(prioritized.get('HIGH', []))})
            Budget: ₹{prioritized.get('HIGH', pd.DataFrame()).get('total_revenue', pd.Series([0])).sum():,.2f}
            Action: Prepare storage space, update inventory system

Week 5-8  : Order MEDIUM priority items ({len(prioritized.get('MEDIUM', []))})
            Budget: ₹{prioritized.get('MEDIUM', pd.DataFrame()).get('total_revenue', pd.Series([0])).sum():,.2f}
            Action: Monitor sales trends, adjust orders if needed

Week 9+   : Restock fast-movers
            Budget: As needed (estimate 50% of critical items)
            Action: Daily monitoring, weekly restocking

✅ IMPLEMENTATION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Review and approve budget allocation
□ Contact suppliers for CRITICAL items
□ Confirm delivery schedules and lead times
□ Prepare storage space for incoming stock
□ Update inventory management system
□ Brief staff on fast-moving items
□ Set up daily monitoring for peak months
□ Establish reorder points and alerts
□ Review supplier performance from last season
□ Plan for 15% buffer stock

📞 QUICK ACTIONS REQUIRED NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    if 'CRITICAL' in prioritized:
        top_3 = prioritized['CRITICAL'].head(3)
        for i, (_, row) in enumerate(top_3.iterrows(), 1):
            guide += f"{i}. ORDER: {row['medicine_name'][:50]}\n"
            guide += f"   Quantity: {int(row['suggested_stock_quantity']):,} units\n"
            guide += f"   Budget: ₹{row['total_revenue']:,.2f}\n"
            guide += f"   Urgency: IMMEDIATE - Expected daily sales: {row['daily_avg_sales']:.1f} units\n\n"
    
    guide += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Report: Seasonal Medical Storage Recommendation System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    
    # Save to text file
    guide_file = f'output/ORDERING_GUIDE_{target_season.upper()}.txt'
    with open(guide_file, 'w', encoding='utf-8') as f:
        f.write(guide)
    
    print(guide)
    print(f"\n✓ Ordering guide saved: '{guide_file}'")
    
    return guide

####################################################################################################
# MAIN EXECUTION SCRIPT
# REFACTORED TO: backend/app.py (Flask application), backend/analyzer.py (AnalysisOrchestrator class)
####################################################################################################

def run_complete_analysis(file_path, target_season='Winter', forecast_top_n=3):
    """
    Executes the complete analysis pipeline from data loading to output generation.
    
    Args:
        file_path (str): Path to the sales data CSV file.
        target_season (str): Season to generate recommendations for.
        forecast_top_n (int): Number of top medicines to forecast.
    
    Returns:
        dict: Complete analysis results.
    """
    print("\n" + "="*80)
    print("PHARMACY SEASONAL ANALYTICS ENGINE - MAIN EXECUTION")
    print("="*80)
    print(f"\nConfiguration:")
    print(f"  Input file: {file_path}")
    print(f"  Target season: {target_season}")
    print(f"  Forecasting top {forecast_top_n} medicines")
    print(f"  Analysis started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Define required columns
    REQUIRED_COLUMNS = [
        'date', 'time', 'invoice_id', 'medicine_name', 'generic_name',
        'brand', 'manufacturer', 'supplier', 'dosage_form', 'strength',
        'category', 'prescription_required', 'quantity', 'unit_price'
    ]
    
    # Step 1: Load Data
    sales_df = load_sales_data(file_path, REQUIRED_COLUMNS)
    
    if sales_df is None:
        print("\n✗ Analysis terminated due to data loading error")
        return None
    
    # Step 2: Clean and Preprocess Data
    sales_df_cleaned = clean_data(sales_df)
    
    # Step 3: Engineer Features
    sales_df_featured = create_features(sales_df_cleaned)
    
    # Step 4: Create Medicine Master List
    medicine_master = create_medicine_master(sales_df_featured, save_file=True)
    
    # Step 5: Perform EDA
    eda_results = perform_eda(sales_df_featured)
    
    # Step 6: Generate Recommendations for Target Season
    recommendations = get_heuristic_recommendations(sales_df_featured, target_season, buffer=0.15)
    
    if recommendations.empty:
        print(f"\n✗ Could not generate recommendations for {target_season}")
        return None
    
    # Step 7: Generate Output Files
    generate_output_file(recommendations, target_season)
    
    # Step 7.5: Create Actionable Dashboard
    create_actionable_dashboard(recommendations, target_season)
    
    # Step 7.6: Generate Simple Ordering Guide
    ordering_guide = generate_simple_ordering_guide(recommendations, target_season)
    
    # Step 8: Advanced Forecasting for Top Medicines
    if forecast_top_n > 0 and not recommendations.empty:
        print("\n" + "="*80)
        print("ADVANCED TIME-SERIES FORECASTING")
        print("="*80)
        
        top_medicines = recommendations.head(forecast_top_n)['medicine_name'].tolist()
        
        print(f"\nGenerating forecasts for top {len(top_medicines)} medicines:")
        
        for i, medicine in enumerate(top_medicines, 1):
            print(f"\n[{i}/{len(top_medicines)}] Forecasting: {medicine[:50]}...")
            
            # Try SARIMA forecast
            try:
                sarima_result = get_timeseries_forecast_sarima(sales_df_featured, medicine, forecast_weeks=12)
            except Exception as e:
                print(f"  ⚠ SARIMA forecast failed: {str(e)}")
                sarima_result = None
            
            # Try Prophet forecast
            try:
                prophet_result = get_timeseries_forecast_prophet(sales_df_featured, medicine, forecast_months=3)
            except Exception as e:
                print(f"  ⚠ Prophet forecast failed: {str(e)}")
                prophet_result = None
    
    # Final Summary
    print("\n" + "="*80)
    print("ANALYSIS COMPLETE - FINAL SUMMARY")
    print("="*80)
    
    print(f"\n📊 Dataset Statistics:")
    print(f"  ├─ Total records processed: {len(sales_df_featured):,}")
    print(f"  ├─ Date range: {sales_df_featured['date'].min().strftime('%Y-%m-%d')} to {sales_df_featured['date'].max().strftime('%Y-%m-%d')}")
    print(f"  ├─ Unique medicines: {sales_df_featured['medicine_name_clean'].nunique():,}")
    print(f"  ├─ Total quantity sold: {sales_df_featured['quantity'].sum():,.0f} units")
    print(f"  └─ Total revenue: ₹{sales_df_featured['total_sales'].sum():,.2f}")
    
    print(f"\n📈 Seasonal Breakdown:")
    for season in ['Summer', 'Monsoon', 'Winter']:
        season_data = sales_df_featured[sales_df_featured['Season'] == season]
        season_qty = season_data['quantity'].sum()
        season_rev = season_data['total_sales'].sum()
        season_pct = (season_qty / sales_df_featured['quantity'].sum()) * 100
        print(f"  ├─ {season:8} : {season_qty:10,.0f} units | ₹{season_rev:12,.2f} ({season_pct:.1f}%)")
    
    print(f"\n💊 Recommendations for {target_season}:")
    print(f"  ├─ Total medicines: {len(recommendations):,}")
    print(f"  ├─ Predicted demand: {recommendations['suggested_stock_quantity'].sum():,.0f} units")
    print(f"  ├─ Expected revenue: ₹{recommendations['total_revenue'].sum():,.2f}")
    print(f"  └─ Fast movers: {recommendations['is_fast_mover'].sum()}")
    
    print(f"\n📁 Output Files Generated:")
    print(f"  ├─ output/medicine_master_list.csv (Complete medicine catalog)")
    print(f"  ├─ output/recommendations_{target_season.lower()}.json (Structured data)")
    print(f"  ├─ output/recommendations_{target_season.lower()}.csv (Complete list)")
    print(f"  ├─ output/recommendations_{target_season.lower()}_detailed.xlsx (Multi-sheet report)")
    print(f"  ├─ output/ORDERING_GUIDE_{target_season.upper()}.txt (Printable guide)")
    print(f"  ├─ output/01_seasonal_sales_overview.png (Sales analysis)")
    print(f"  ├─ output/02_top_medicines_by_season.png (Top sellers)")
    print(f"  ├─ output/03_medicine_trends_analysis.png (Trend analysis)")
    print(f"  ├─ output/06_actionable_dashboard_{target_season.lower()}.png (Action dashboard)")
    if forecast_top_n > 0:
        print(f"  ├─ output/04_sarima_forecast_*.png (SARIMA forecasts)")
        print(f"  └─ output/05_prophet_forecast_*.png (Prophet forecasts)")
    
    print(f"\n💡 NEXT STEPS:")
    print(f"  1. Review the output/ORDERING_GUIDE_{target_season.upper()}.txt file")
    print(f"  2. Share the actionable dashboard with management")
    print(f"  3. Use the Excel file for detailed planning")
    print(f"  4. Set up supplier meetings for CRITICAL items")
    print(f"  5. Configure inventory alerts for fast-movers")
    
    print(f"\n⏱️  Analysis completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n" + "="*80)
    print("✅ ALL PROCESSES COMPLETED SUCCESSFULLY")
    print("="*80 + "\n")
    
    return {
        'data': sales_df_featured,
        'medicine_master': medicine_master,
        'eda_results': eda_results,
        'recommendations': recommendations,
        'target_season': target_season
    }

####################################################################################################
# USAGE INSTRUCTIONS & EXECUTION
####################################################################################################

if __name__ == '__main__':
    print("""
╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║           SEASONAL MEDICAL STORAGE RECOMMENDATION SYSTEM                       ║
║                      Google Colab Implementation                               ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝

USAGE INSTRUCTIONS:
===================

1. UPLOAD YOUR DATA:
   • Click the folder icon (📁) in the left sidebar
   • Upload your sales_data.csv file
   • Right-click the file and select "Copy path"

2. CONFIGURE SETTINGS:
   • Paste the file path in the FILE_PATH variable below
   • Choose your target season: 'Summer', 'Monsoon', or 'Winter'

3. RUN THE ANALYSIS:
   • Execute this cell to run the complete pipeline
   • All charts and files will be generated automatically

4. VIEW RESULTS:
   • JSON files contain structured recommendations
   • CSV files for Excel/database import
   • PNG charts for presentations and reports

════════════════════════════════════════════════════════════════════════════════
""")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CONFIGURATION SECTION - MODIFY THESE SETTINGS
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Path to your uploaded CSV file
    FILE_PATH = r"C:\Users\durve\OneDrive\Desktop\SEM 5\5TH3. STATISTICAL METHODS IN SIX\Seasonal Medicine Recpmmener Engine Applied\input\konkan_pharmacy_sales_55k.csv"  # <-- PASTE YOUR FILE PATH HERE
    
    # Target season for recommendations
    TARGET_SEASON = 'Winter'  # Options: 'Summer', 'Monsoon', 'Winter'
    
    # Number of top medicines to forecast
    FORECAST_TOP_N = 3  # Set to 0 to skip forecasting
    
    # ═══════════════════════════════════════════════════════════════════════════
    
    print("\n⚙️  Configuration:")
    print(f"   • File Path: {FILE_PATH}")
    print(f"   • Target Season: {TARGET_SEASON}")
    print(f"   • Forecast Top N: {FORECAST_TOP_N}")
    print("\n" + "═"*80 + "\n")
    
    # Uncomment the line below to run the analysis
    results = run_complete_analysis(FILE_PATH, TARGET_SEASON, FORECAST_TOP_N)
    
'''
    print("""
To run the analysis, uncomment the last line above or execute:

    results = run_complete_analysis(FILE_PATH, TARGET_SEASON, FORECAST_TOP_N)

You can also run with custom parameters:

    results = run_complete_analysis(
        file_path='/content/sales_data.csv',
        target_season='Monsoon',
        forecast_top_n=5
    )
    
After execution, access results:
    
    # View processed data
    df = results['data']
    
    # View recommendations
    recommendations = results['recommendations']
    print(recommendations.head(10))
    
    # Export to Excel
    recommendations.to_excel('winter_recommendations.xlsx', index=False)
""")
'''

# ================================================================================================
# REFACTORING COMPLETE - MODULAR BACKEND SYSTEM AVAILABLE
# ================================================================================================
# This monolithic file (1,857 lines) has been successfully refactored into a clean, 
# modular backend system with the following structure:
#
# REFACTORED BACKEND FILES:
# ------------------------
# backend/__init__.py          # Package initialization and exports
# backend/config.py            # Configuration and environment constants
# backend/database.py          # SQLite database connection and management
# backend/models.py            # Database schemas and table definitions
# backend/data_loader.py       # CSV loading, validation, and database population
# backend/analyzer.py          # All analytical logic and statistical processing
# backend/routes.py            # Flask API endpoints for web integration
# backend/utils.py             # Utility functions and data processing helpers
# backend/app.py               # Flask application entry point and server
#
# KEY BENEFITS OF REFACTORED VERSION:
# ----------------------------------
# ✅ Modular Architecture: 8 specialized modules vs 1 monolithic file
# ✅ Database Integration: Full SQLite database with normalized schema
# ✅ API Framework: RESTful endpoints ready for frontend integration
# ✅ Error Handling: Comprehensive logging and graceful error management
# ✅ Configuration: Centralized settings with environment-based config
# ✅ Type Safety: Full type hints and comprehensive documentation
# ✅ Production Ready: Proper error handling, logging, and monitoring
# ✅ Scalable: Easy to extend and maintain
#
# USAGE COMPARISON:
# ----------------
# Original (this file):     python Engine.py
# Refactored (modular):     from backend import run_development_server; run_development_server()
# API Server:              python -m backend.app
#
# FUNCTIONAL COMPATIBILITY:
# -------------------------
# The refactored system maintains 100% functional compatibility with this original file
# while providing improved architecture, database persistence, and web API capabilities.
#
# For detailed information, see: REFACTORING_SUMMARY.md
# ================================================================================================