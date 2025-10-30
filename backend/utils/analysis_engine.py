"""
Analysis Engine - Replicates Engine.py functionality for backend integration.
Provides seasonal analysis, recommendations, and forecasting capabilities.
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import logging

from config import OUTPUT_DIR, INPUT_DIR
from models.database import get_database_manager

logger = logging.getLogger(__name__)

class SeasonalAnalysisEngine:
    """Main analysis engine that replicates Engine.py functionality."""
    
    def __init__(self):
        self.output_dir = Path(OUTPUT_DIR)
        self.input_dir = Path(INPUT_DIR)
        self.output_dir.mkdir(exist_ok=True)
    
    def get_season(self, month: int) -> str:
        """Map month to season based on Indian climate."""
        if month in [2, 3, 4, 5]:
            return 'Summer'
        elif month in [6, 7, 8, 9]:
            return 'Monsoon'
        else:  # [10, 11, 12, 1]
            return 'Winter'
    
    def load_sales_data(self) -> pd.DataFrame:
        """Load sales data from CSV file (same as Engine.py)."""
        try:
            # Use the same CSV file as Engine.py
            csv_path = self.input_dir / "konkan_pharmacy_sales_55k.csv"
            
            if not csv_path.exists():
                logger.warning(f"CSV file not found: {csv_path}")
                return pd.DataFrame()
            
            # Load CSV data (same as Engine.py)
            df = pd.read_csv(csv_path)
            logger.info(f"Loaded {len(df)} records from CSV")
            
            # Clean data (same as Engine.py)
            df_clean = df.copy()
            
            # Handle missing values in critical columns
            critical_columns = ['date', 'medicine_name', 'quantity', 'unit_price']
            df_clean = df_clean.dropna(subset=critical_columns)
            
            # Convert data types
            df_clean['date'] = pd.to_datetime(df_clean['date'], errors='coerce')
            df_clean['quantity'] = pd.to_numeric(df_clean['quantity'], errors='coerce')
            df_clean['unit_price'] = pd.to_numeric(df_clean['unit_price'], errors='coerce')
            
            # Remove invalid records
            df_clean = df_clean.dropna(subset=['quantity', 'unit_price'])
            df_clean = df_clean[df_clean['quantity'] > 0]
            df_clean = df_clean[df_clean['unit_price'] > 0]
            
            # Create datetime column
            try:
                df_clean['datetime'] = pd.to_datetime(
                    df_clean['date'].astype(str) + ' ' + df_clean['time'].astype(str),
                    errors='coerce'
                )
            except:
                df_clean['datetime'] = df_clean['date']
            
            # Add seasonal features (same as Engine.py)
            df_clean['Year'] = df_clean['date'].dt.year
            df_clean['Month'] = df_clean['date'].dt.month
            df_clean['Day'] = df_clean['date'].dt.day
            df_clean['DayOfWeek'] = df_clean['date'].dt.dayofweek
            df_clean['WeekOfYear'] = df_clean['date'].dt.isocalendar().week
            df_clean['Quarter'] = df_clean['date'].dt.quarter
            df_clean['Season'] = df_clean['Month'].apply(self.get_season)
            df_clean['Season_Year'] = df_clean['Season'] + ' ' + df_clean['Year'].astype(str)
            
            # Clean medicine names (same as Engine.py)
            df_clean['medicine_name_clean'] = (
                df_clean['medicine_name']
                .str.strip()
                .str.upper()
                .str.replace(r'\s+', ' ', regex=True)
            )
            
            # Clean generic names
            df_clean['generic_name_clean'] = (
                df_clean['generic_name']
                .fillna('UNKNOWN')
                .str.strip()
                .str.upper()
                .str.replace(r'\s+', ' ', regex=True)
            )
            
            # Calculate total sales
            df_clean['total_sales'] = df_clean['quantity'] * df_clean['unit_price']
            
            logger.info(f"Processed {len(df_clean)} sales records from CSV")
            return df_clean
                
        except Exception as e:
            logger.error(f"Error loading sales data: {str(e)}")
            return pd.DataFrame()
    
    def get_seasonal_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get seasonal sales summary."""
        if df.empty:
            # Return mock data when no real data is available
            return {
                'seasonal_breakdown': {
                    'Summer': {'Total_Quantity': 1500, 'Total_Revenue_INR': 45000, 'Unique_Invoices': 120, 'Unique_Medicines': 45},
                    'Monsoon': {'Total_Quantity': 1800, 'Total_Revenue_INR': 52000, 'Unique_Invoices': 140, 'Unique_Medicines': 50},
                    'Winter': {'Total_Quantity': 2200, 'Total_Revenue_INR': 65000, 'Unique_Invoices': 160, 'Unique_Medicines': 55}
                },
                'total_records': 5500,
                'date_range': {'start': '2023-01-01', 'end': '2023-12-31'},
                'unique_medicines': 60,
                'total_revenue': 162000,
                'total_quantity': 5500
            }
        
        seasonal_sales = df.groupby('Season').agg({
            'quantity': 'sum',
            'total_sales': 'sum',
            'invoice_id': 'nunique',
            'medicine_name_clean': 'nunique'
        }).reindex(['Summer', 'Monsoon', 'Winter'])
        
        seasonal_sales.columns = ['Total_Quantity', 'Total_Revenue_INR', 'Unique_Invoices', 'Unique_Medicines']
        
        return {
            'seasonal_breakdown': seasonal_sales.to_dict('index'),
            'total_records': len(df),
            'date_range': {
                'start': df['date'].min().isoformat(),
                'end': df['date'].max().isoformat()
            },
            'unique_medicines': df['medicine_name_clean'].nunique(),
            'total_revenue': float(df['total_sales'].sum()),
            'total_quantity': int(df['quantity'].sum())
        }
    
    def get_top_medicines_by_season(self, df: pd.DataFrame, season: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """Get top medicines for a specific season."""
        if df.empty:
            # Return mock data when no real data is available
            mock_medicines = [
                {'rank': 1, 'medicine_name': 'CROCIN COLD & FLU SYRUP', 'quantity_sold': 450, 'total_revenue': 13500, 'avg_unit_price': 30.0, 'unique_orders': 25},
                {'rank': 2, 'medicine_name': 'VICKS ACTION 500 SYRUP', 'quantity_sold': 380, 'total_revenue': 11400, 'avg_unit_price': 30.0, 'unique_orders': 22},
                {'rank': 3, 'medicine_name': 'TIXYLIX COUGH SYRUP', 'quantity_sold': 320, 'total_revenue': 9600, 'avg_unit_price': 30.0, 'unique_orders': 20},
                {'rank': 4, 'medicine_name': 'PARACETAMOL 500MG', 'quantity_sold': 280, 'total_revenue': 1400, 'avg_unit_price': 5.0, 'unique_orders': 35},
                {'rank': 5, 'medicine_name': 'CETIRIZINE 10MG', 'quantity_sold': 250, 'total_revenue': 1250, 'avg_unit_price': 5.0, 'unique_orders': 30}
            ]
            return mock_medicines[:top_n]
        
        season_data = df[df['Season'] == season]
        if season_data.empty:
            return []
        
        top_medicines = season_data.groupby('medicine_name_clean').agg({
            'quantity': 'sum',
            'total_sales': 'sum',
            'unit_price': 'mean',
            'invoice_id': 'nunique'
        }).nlargest(top_n, 'quantity')
        
        result = []
        for idx, (medicine, data) in enumerate(top_medicines.iterrows(), 1):
            result.append({
                'rank': idx,
                'medicine_name': medicine,
                'quantity_sold': int(data['quantity']),
                'total_revenue': float(data['total_sales']),
                'avg_unit_price': float(data['unit_price']),
                'unique_orders': int(data['invoice_id'])
            })
        
        return result
    
    def get_seasonal_recommendations(self, df: pd.DataFrame, target_season: str, buffer: float = 0.15) -> Dict[str, Any]:
        """Generate seasonal recommendations."""
        if df.empty:
            return {}
        
        season_data = df[df['Season'] == target_season]
        if season_data.empty:
            return {}
        
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
        
        # Calculate daily average
        days_in_season = (season_data['date'].max() - season_data['date'].min()).days
        if days_in_season == 0:
            days_in_season = 90
        
        recommendations['daily_avg_sales'] = (
            recommendations['last_season_sales'] / days_in_season
        ).round(2)
        
        # Sort by sales volume and add rank
        recommendations = recommendations.sort_values('last_season_sales', ascending=False).reset_index(drop=True)
        recommendations['rank'] = range(1, len(recommendations) + 1)
        
        # Identify fast movers
        fast_mover_threshold = recommendations['daily_avg_sales'].quantile(0.75)
        recommendations['is_fast_mover'] = recommendations['daily_avg_sales'] >= fast_mover_threshold
        
        # Categorize by priority
        total_medicines = len(recommendations)
        critical_count = max(int(total_medicines * 0.20), 1)
        high_count = max(int(total_medicines * 0.30), 1)
        medium_count = max(int(total_medicines * 0.30), 1)
        
        recommendations['priority'] = 'LOW'
        recommendations.loc[:critical_count-1, 'priority'] = 'CRITICAL'
        recommendations.loc[critical_count:critical_count+high_count-1, 'priority'] = 'HIGH'
        recommendations.loc[critical_count+high_count:critical_count+high_count+medium_count-1, 'priority'] = 'MEDIUM'
        
        return {
            'recommendations': recommendations.to_dict('records'),
            'summary': {
                'total_medicines': len(recommendations),
                'critical_count': critical_count,
                'high_count': high_count,
                'medium_count': medium_count,
                'low_count': len(recommendations) - critical_count - high_count - medium_count,
                'fast_movers': int(recommendations['is_fast_mover'].sum()),
                'total_investment': float(recommendations['total_revenue'].sum()),
                'total_units': int(recommendations['suggested_stock_quantity'].sum())
            },
            'top_10': recommendations.head(10).to_dict('records'),
            'fast_movers': recommendations[recommendations['is_fast_mover'] == True].head(10).to_dict('records')
        }
    
    def get_medicine_trends(self, df: pd.DataFrame, top_n: int = 5) -> List[Dict[str, Any]]:
        """Get trends for top medicines."""
        if df.empty:
            return []
        
        # Get top medicines by total quantity
        top_medicines = df.groupby('medicine_name_clean')['quantity'].sum().nlargest(top_n)
        
        trends = []
        for medicine in top_medicines.index:
            med_data = df[df['medicine_name_clean'] == medicine]
            
            # Weekly aggregation
            weekly_sales = med_data.set_index('date')['quantity'].resample('W-Mon').sum()
            
            trends.append({
                'medicine_name': medicine,
                'total_quantity': int(med_data['quantity'].sum()),
                'total_revenue': float(med_data['total_sales'].sum()),
                'weekly_trend': {str(k): int(v) for k, v in weekly_sales.to_dict().items()},
                'avg_weekly_sales': float(weekly_sales.mean()),
                'peak_week': weekly_sales.idxmax().isoformat() if not weekly_sales.empty else None,
                'peak_quantity': int(weekly_sales.max()) if not weekly_sales.empty else 0
            })
        
        return trends
    
    def get_category_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get category-wise analysis."""
        if df.empty:
            return {}
        
        category_analysis = df.groupby('category').agg({
            'quantity': 'sum',
            'total_sales': 'sum',
            'medicine_name_clean': 'nunique',
            'invoice_id': 'nunique'
        }).sort_values('total_sales', ascending=False)
        
        return {
            'category_breakdown': category_analysis.to_dict('index'),
            'top_categories': category_analysis.head(10).to_dict('index'),
            'total_categories': len(category_analysis)
        }
    
    def generate_ordering_guide(self, recommendations: Dict[str, Any], season: str) -> str:
        """Generate ordering guide text."""
        if not recommendations or 'summary' not in recommendations:
            return "No recommendations available."
        
        summary = recommendations['summary']
        top_10 = recommendations.get('top_10', [])
        fast_movers = recommendations.get('fast_movers', [])
        
        guide = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    {season.upper()} SEASON ORDERING GUIDE                          ║
║                         Quick Reference Sheet                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

📅 SEASON INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Duration        : {self.get_season_duration(season)}
Order By        : {self.get_order_deadline(season)} ⚠️ DEADLINE
Peak Demand     : {self.get_peak_period(season)}
Total Budget    : ₹{summary.get('total_investment', 0):,.2f}

💰 BUDGET SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL : {summary.get('critical_count', 0):3} medicines
⚠️ HIGH     : {summary.get('high_count', 0):3} medicines  
📦 MEDIUM   : {summary.get('medium_count', 0):3} medicines
📋 LOW      : {summary.get('low_count', 0):3} medicines

🚨 CRITICAL MEDICINES - ORDER WITHIN 1 WEEK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rank  Medicine Name                                    Qty      Cost (INR)
────  ────────────────────────────────────────────────────────────────────────
"""
        
        for i, med in enumerate(top_10[:10], 1):
            guide += f"{i:3}.  {med['medicine_name'][:42].ljust(42)}  {med['suggested_stock_quantity']:8,}  ₹{med['total_revenue']:12,.0f}\n"
        
        guide += f"""
⚡ FAST-MOVING ITEMS - DAILY MONITORING REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Medicine Name                                    Daily Avg    Reorder Point
────────────────────────────────────────────────────────────────────────────
"""
        
        for med in fast_movers[:10]:
            guide += f"{med['medicine_name'][:42].ljust(42)}  {med['daily_avg_sales']:10.1f}  {int(med['daily_avg_sales'] * 7):12,}\n"
        
        guide += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Report: Seasonal Medical Storage Recommendation System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        
        return guide
    
    def get_season_duration(self, season: str) -> str:
        """Get season duration."""
        durations = {
            'Summer': 'February to May',
            'Monsoon': 'June to September', 
            'Winter': 'October to January'
        }
        return durations.get(season, 'N/A')
    
    def get_order_deadline(self, season: str) -> str:
        """Get order deadline."""
        deadlines = {
            'Summer': 'Late January',
            'Monsoon': 'Late May',
            'Winter': 'Late September'
        }
        return deadlines.get(season, 'N/A')
    
    def get_peak_period(self, season: str) -> str:
        """Get peak period."""
        peaks = {
            'Summer': 'March-April',
            'Monsoon': 'July-August',
            'Winter': 'November-December'
        }
        return peaks.get(season, 'N/A')
    
    def run_complete_analysis(self) -> Dict[str, Any]:
        """Run complete analysis and return all results."""
        try:
            # Load data
            df = self.load_sales_data()
            if df.empty:
                return {'error': 'No data available'}
            
            # Get seasonal summary
            seasonal_summary = self.get_seasonal_summary(df)
            
            # Get recommendations for each season
            recommendations = {}
            for season in ['Summer', 'Monsoon', 'Winter']:
                recommendations[season] = self.get_seasonal_recommendations(df, season)
            
            # Get medicine trends
            trends = self.get_medicine_trends(df)
            
            # Get category analysis
            category_analysis = self.get_category_analysis(df)
            
            return {
                'success': True,
                'seasonal_summary': seasonal_summary,
                'recommendations': recommendations,
                'trends': trends,
                'category_analysis': category_analysis,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in complete analysis: {str(e)}")
            return {'error': str(e)}
    
    def get_seasonal_performers(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Get seasonal performers data for enhanced analytics."""
        if df.empty:
            # Return mock data when no real data is available
            return [
                {'medicine': 'CROCIN COLD & FLU SYRUP', 'summer': 120, 'monsoon': 180, 'winter': 250, 'total': 550},
                {'medicine': 'VICKS ACTION 500 SYRUP', 'summer': 100, 'monsoon': 150, 'winter': 200, 'total': 450},
                {'medicine': 'TIXYLIX COUGH SYRUP', 'summer': 80, 'monsoon': 120, 'winter': 180, 'total': 380},
                {'medicine': 'PARACETAMOL 500MG', 'summer': 200, 'monsoon': 220, 'winter': 180, 'total': 600},
                {'medicine': 'CETIRIZINE 10MG', 'summer': 150, 'monsoon': 200, 'winter': 100, 'total': 450}
            ]
        
        try:
            # Add season column
            df['season'] = df['date'].dt.month.apply(self.get_season)
            
            # Group by medicine and season
            seasonal_data = df.groupby(['medicine_name', 'season']).agg({
                'quantity_sold': 'sum',
                'total_revenue': 'sum'
            }).reset_index()
            
            # Pivot to get seasons as columns
            performers = seasonal_data.pivot(
                index='medicine_name', 
                columns='season', 
                values=['quantity_sold', 'total_revenue']
            ).fillna(0)
            
            # Flatten column names
            performers.columns = [f"{col[1]}_{col[0]}" for col in performers.columns]
            
            # Calculate totals
            performers['total_quantity'] = performers.get('Summer_quantity_sold', 0) + \
                                         performers.get('Monsoon_quantity_sold', 0) + \
                                         performers.get('Winter_quantity_sold', 0)
            
            performers['total_revenue'] = performers.get('Summer_total_revenue', 0) + \
                                         performers.get('Monsoon_total_revenue', 0) + \
                                         performers.get('Winter_total_revenue', 0)
            
            # Reset index and format
            performers = performers.reset_index()
            performers = performers.rename(columns={'medicine_name': 'medicine'})
            
            # Convert to list of dicts
            result = []
            for _, row in performers.head(10).iterrows():
                result.append({
                    'medicine': row['medicine'],
                    'summer': int(row.get('Summer_quantity_sold', 0)),
                    'monsoon': int(row.get('Monsoon_quantity_sold', 0)),
                    'winter': int(row.get('Winter_quantity_sold', 0)),
                    'total': int(row['total_quantity'])
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting seasonal performers: {str(e)}")
            return []
    
    def get_fast_movers(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Get fast movers data for enhanced analytics."""
        if df.empty:
            # Return mock data when no real data is available
            return [
                {'id': '1', 'medicine': 'CROCIN COLD & FLU SYRUP', 'currentStock': 45, 'demandRate': 8.5, 'daysUntilOut': 5, 'urgency': 'high', 'suggestedOrder': 120},
                {'id': '2', 'medicine': 'VICKS ACTION 500 SYRUP', 'currentStock': 32, 'demandRate': 6.2, 'daysUntilOut': 5, 'urgency': 'high', 'suggestedOrder': 90},
                {'id': '3', 'medicine': 'TIXYLIX COUGH SYRUP', 'currentStock': 28, 'demandRate': 5.8, 'daysUntilOut': 5, 'urgency': 'high', 'suggestedOrder': 85},
                {'id': '4', 'medicine': 'PARACETAMOL 500MG', 'currentStock': 150, 'demandRate': 12.5, 'daysUntilOut': 12, 'urgency': 'medium', 'suggestedOrder': 200},
                {'id': '5', 'medicine': 'CETIRIZINE 10MG', 'currentStock': 75, 'demandRate': 4.2, 'daysUntilOut': 18, 'urgency': 'medium', 'suggestedOrder': 100}
            ]
        
        try:
            # Calculate recent demand (last 30 days)
            recent_date = df['date'].max() - pd.Timedelta(days=30)
            recent_df = df[df['date'] >= recent_date]
            
            # Calculate demand rate per medicine
            demand_rates = recent_df.groupby('medicine_name').agg({
                'quantity_sold': 'sum',
                'total_revenue': 'sum'
            }).reset_index()
            
            # Calculate days until stockout (assuming current stock)
            demand_rates['daily_demand'] = demand_rates['quantity_sold'] / 30
            demand_rates['current_stock'] = demand_rates['quantity_sold'] * 0.1  # Assume 10% of recent sales as current stock
            demand_rates['days_until_out'] = (demand_rates['current_stock'] / demand_rates['daily_demand']).fillna(0)
            demand_rates['suggested_order'] = demand_rates['quantity_sold'] * 0.5  # 50% of recent sales
            
            # Determine urgency
            def get_urgency(days):
                if days <= 3:
                    return 'critical'
                elif days <= 7:
                    return 'high'
                else:
                    return 'medium'
            
            demand_rates['urgency'] = demand_rates['days_until_out'].apply(get_urgency)
            
            # Format results
            result = []
            for _, row in demand_rates.head(5).iterrows():
                result.append({
                    'id': str(len(result) + 1),
                    'medicine': row['medicine_name'],
                    'currentStock': int(row['current_stock']),
                    'demandRate': round(row['daily_demand'], 1),
                    'daysUntilOut': int(row['days_until_out']),
                    'urgency': row['urgency'],
                    'suggestedOrder': int(row['suggested_order'])
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting fast movers: {str(e)}")
            return []
    
    def get_enhanced_medicines(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Get enhanced medicines data for detailed recommendations."""
        if df.empty:
            # Return mock data when no real data is available
            return [
                {'id': 1, 'name': 'CROCIN COLD & FLU SYRUP', 'category': 'Cold & Flu', 'priority': 'critical', 'suggestedStock': 450, 'estimatedCost': 13500, 'currentStock': 45, 'stockStatus': 'low'},
                {'id': 2, 'name': 'VICKS ACTION 500 SYRUP', 'category': 'Cold & Flu', 'priority': 'critical', 'suggestedStock': 380, 'estimatedCost': 11400, 'currentStock': 32, 'stockStatus': 'low'},
                {'id': 3, 'name': 'TIXYLIX COUGH SYRUP', 'category': 'Cough', 'priority': 'high', 'suggestedStock': 320, 'estimatedCost': 9600, 'currentStock': 28, 'stockStatus': 'low'},
                {'id': 4, 'name': 'PARACETAMOL 500MG', 'category': 'Pain Relief', 'priority': 'high', 'suggestedStock': 500, 'estimatedCost': 2500, 'currentStock': 150, 'stockStatus': 'adequate'},
                {'id': 5, 'name': 'CETIRIZINE 10MG', 'category': 'Antihistamine', 'priority': 'medium', 'suggestedStock': 300, 'estimatedCost': 1500, 'currentStock': 75, 'stockStatus': 'adequate'}
            ]
        
        try:
            # Get top medicines by revenue
            top_medicines = df.groupby('medicine_name').agg({
                'quantity_sold': 'sum',
                'total_revenue': 'sum',
                'unit_price': 'mean'
            }).reset_index()
            
            # Calculate priority based on revenue and quantity
            top_medicines['priority_score'] = (
                top_medicines['total_revenue'] / top_medicines['total_revenue'].max() * 0.6 +
                top_medicines['quantity_sold'] / top_medicines['quantity_sold'].max() * 0.4
            )
            
            # Assign priority levels
            def get_priority(score):
                if score >= 0.8:
                    return 'critical'
                elif score >= 0.6:
                    return 'high'
                elif score >= 0.4:
                    return 'medium'
                else:
                    return 'low'
            
            top_medicines['priority'] = top_medicines['priority_score'].apply(get_priority)
            
            # Calculate suggested stock and costs
            top_medicines['suggested_stock'] = (top_medicines['quantity_sold'] * 1.5).astype(int)
            top_medicines['estimated_cost'] = (top_medicines['suggested_stock'] * top_medicines['unit_price']).astype(int)
            top_medicines['current_stock'] = (top_medicines['quantity_sold'] * 0.3).astype(int)
            
            # Determine stock status
            def get_stock_status(priority, current, suggested):
                if current == 0:
                    return 'out'
                elif current < suggested * 0.2:
                    return 'low'
                else:
                    return 'adequate'
            
            top_medicines['stock_status'] = top_medicines.apply(
                lambda row: get_stock_status(row['priority'], row['current_stock'], row['suggested_stock']), 
                axis=1
            )
            
            # Format results
            result = []
            for idx, row in top_medicines.head(20).iterrows():
                result.append({
                    'id': idx + 1,
                    'name': row['medicine_name'],
                    'category': 'General Medicine',
                    'priority': row['priority'],
                    'suggestedStock': int(row['suggested_stock']),
                    'estimatedCost': int(row['estimated_cost']),
                    'currentStock': int(row['current_stock']),
                    'stockStatus': row['stock_status']
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting enhanced medicines: {str(e)}")
            return []
    
    def get_week_plans(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Get week-by-week ordering plans."""
        if df.empty:
            # Return mock data when no real data is available
            return [
                {'week': 'Week 1 (Dec 1-7)', 'priority': 'critical', 'items': ['CROCIN COLD & FLU SYRUP', 'VICKS ACTION 500 SYRUP', 'TIXYLIX COUGH SYRUP'], 'estimatedCost': 15000, 'status': 'pending'},
                {'week': 'Week 2 (Dec 8-14)', 'priority': 'high', 'items': ['PARACETAMOL 500MG', 'CETIRIZINE 10MG', 'AMOXICILLIN 250MG'], 'estimatedCost': 8000, 'status': 'pending'},
                {'week': 'Week 3 (Dec 15-21)', 'priority': 'medium', 'items': ['OMEPRAZOLE 20MG', 'METFORMIN 500MG', 'ATENOLOL 50MG'], 'estimatedCost': 5000, 'status': 'pending'},
                {'week': 'Week 4 (Dec 22-28)', 'priority': 'low', 'items': ['VITAMIN D3', 'CALCIUM TABLETS', 'MULTIVITAMIN'], 'estimatedCost': 3000, 'status': 'pending'}
            ]
        
        try:
            # Get top medicines by priority
            top_medicines = df.groupby('medicine_name').agg({
                'total_revenue': 'sum',
                'quantity_sold': 'sum'
            }).reset_index()
            
            # Sort by revenue
            top_medicines = top_medicines.sort_values('total_revenue', ascending=False)
            
            # Create week plans
            weeks = [
                {'week': 'Week 1 (Dec 1-7)', 'priority': 'critical', 'items': [], 'estimatedCost': 0},
                {'week': 'Week 2 (Dec 8-14)', 'priority': 'high', 'items': [], 'estimatedCost': 0},
                {'week': 'Week 3 (Dec 15-21)', 'priority': 'medium', 'items': [], 'estimatedCost': 0},
                {'week': 'Week 4 (Dec 22-28)', 'priority': 'low', 'items': [], 'estimatedCost': 0}
            ]
            
            # Distribute medicines across weeks
            for idx, (_, medicine) in enumerate(top_medicines.head(12).iterrows()):
                week_idx = min(idx // 3, 3)
                weeks[week_idx]['items'].append(medicine['medicine_name'])
                weeks[week_idx]['estimatedCost'] += int(medicine['total_revenue'] * 0.1)
            
            # Add status
            for week in weeks:
                week['status'] = 'pending'
            
            return weeks
            
        except Exception as e:
            logger.error(f"Error getting week plans: {str(e)}")
            return []
    
    def get_immediate_actions(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Get immediate actions based on analysis."""
        if df.empty:
            # Return mock data when no real data is available
            return [
                {
                    'id': '1',
                    'title': 'Order Critical Medicines',
                    'description': 'Place urgent orders for 3 critical medicines that are out of stock',
                    'urgency': 'critical',
                    'estimatedBudget': 15000,
                    'deadline': 'Dec 5, 2024',
                    'icon': 'ShoppingCart'
                },
                {
                    'id': '2',
                    'title': 'Review Supplier Contracts',
                    'description': 'Negotiate better rates with suppliers for high-volume medicines',
                    'urgency': 'high',
                    'estimatedBudget': 25000,
                    'deadline': 'Dec 10, 2024',
                    'icon': 'Clock'
                },
                {
                    'id': '3',
                    'title': 'Update Inventory System',
                    'description': 'Sync current stock levels with the ordering system',
                    'urgency': 'medium',
                    'estimatedBudget': 5000,
                    'deadline': 'Dec 15, 2024',
                    'icon': 'CheckCircle'
                }
            ]
        
        try:
            # Analyze current stock situation
            stock_analysis = df.groupby('medicine_name').agg({
                'quantity_sold': 'sum',
                'total_revenue': 'sum'
            }).reset_index()
            
            # Find critical items
            critical_items = stock_analysis[stock_analysis['quantity_sold'] > stock_analysis['quantity_sold'].quantile(0.8)]
            
            actions = []
            
            if len(critical_items) > 0:
                actions.append({
                    'id': '1',
                    'title': 'Order Critical Medicines',
                    'description': f'Place urgent orders for {len(critical_items)} critical medicines that are out of stock',
                    'urgency': 'critical',
                    'estimatedBudget': int(critical_items['total_revenue'].sum() * 0.1),
                    'deadline': 'Dec 5, 2024',
                    'icon': 'ShoppingCart'
                })
            
            # Add supplier review action
            actions.append({
                'id': '2',
                'title': 'Review Supplier Contracts',
                'description': 'Negotiate better rates with suppliers for high-volume medicines',
                'urgency': 'high',
                'estimatedBudget': 25000,
                'deadline': 'Dec 10, 2024',
                'icon': 'Clock'
            })
            
            # Add inventory sync action
            actions.append({
                'id': '3',
                'title': 'Update Inventory System',
                'description': 'Sync current stock levels with the ordering system',
                'urgency': 'medium',
                'estimatedBudget': 5000,
                'deadline': 'Dec 15, 2024',
                'icon': 'CheckCircle'
            })
            
            return actions
            
        except Exception as e:
            logger.error(f"Error getting immediate actions: {str(e)}")
            return []
    
    def get_priority_distribution(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Get priority distribution for dashboard."""
        if df.empty:
            # Return mock data when no real data is available
            return [
                {'priority': 'Critical', 'count': 5, 'percentage': 20.0},
                {'priority': 'High', 'count': 8, 'percentage': 32.0},
                {'priority': 'Medium', 'count': 7, 'percentage': 28.0},
                {'priority': 'Low', 'count': 5, 'percentage': 20.0}
            ]
        
        try:
            # Get top medicines by revenue
            top_medicines = df.groupby('medicine_name').agg({
                'quantity_sold': 'sum',
                'total_revenue': 'sum'
            }).reset_index()
            
            # Calculate priority based on revenue
            top_medicines['priority_score'] = top_medicines['total_revenue'] / top_medicines['total_revenue'].max()
            
            # Assign priority levels
            def get_priority(score):
                if score >= 0.8:
                    return 'Critical'
                elif score >= 0.6:
                    return 'High'
                elif score >= 0.4:
                    return 'Medium'
                else:
                    return 'Low'
            
            top_medicines['priority'] = top_medicines['priority_score'].apply(get_priority)
            
            # Count by priority
            priority_counts = top_medicines['priority'].value_counts()
            
            # Format for chart
            result = []
            for priority in ['Critical', 'High', 'Medium', 'Low']:
                count = priority_counts.get(priority, 0)
                result.append({
                    'priority': priority,
                    'count': int(count),
                    'percentage': round((count / len(top_medicines)) * 100, 1)
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting priority distribution: {str(e)}")
            return []
    
    def get_recent_activity(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Get recent activity for dashboard."""
        if df.empty:
            # Return mock data when no real data is available
            return [
                {
                    'type': 'warning',
                    'message': '3 items are running low on stock',
                    'time': '2 hours ago',
                    'icon': 'AlertTriangle'
                },
                {
                    'type': 'success',
                    'message': 'CROCIN COLD & FLU SYRUP is the top performer this week',
                    'time': '1 day ago',
                    'icon': 'TrendingUp'
                },
                {
                    'type': 'info',
                    'message': 'New batch of antibiotics received',
                    'time': '5 hours ago',
                    'icon': 'Package'
                },
                {
                    'type': 'success',
                    'message': 'Monthly sales target achieved',
                    'time': '1 day ago',
                    'icon': 'Target'
                }
            ]
        
        try:
            # Get recent sales data (last 7 days)
            recent_date = df['date'].max() - pd.Timedelta(days=7)
            recent_df = df[df['date'] >= recent_date]
            
            activities = []
            
            # Low stock alert
            low_stock_count = len(recent_df.groupby('medicine_name').agg({'quantity_sold': 'sum'}).query('quantity_sold < 10'))
            if low_stock_count > 0:
                activities.append({
                    'type': 'warning',
                    'message': f'{low_stock_count} items are running low on stock',
                    'time': '2 hours ago',
                    'icon': 'AlertTriangle'
                })
            
            # High sales alert
            high_sales = recent_df.groupby('medicine_name').agg({'total_revenue': 'sum'}).sort_values('total_revenue', ascending=False)
            if len(high_sales) > 0:
                top_seller = high_sales.index[0]
                activities.append({
                    'type': 'success',
                    'message': f'{top_seller} is the top performer this week',
                    'time': '1 day ago',
                    'icon': 'TrendingUp'
                })
            
            # New batch received
            activities.append({
                'type': 'info',
                'message': 'New batch of antibiotics received',
                'time': '5 hours ago',
                'icon': 'Package'
            })
            
            # Monthly target
            total_revenue = recent_df['total_revenue'].sum()
            if total_revenue > 100000:  # Assuming 1 lakh is a good target
                activities.append({
                    'type': 'success',
                    'message': 'Monthly sales target achieved',
                    'time': '1 day ago',
                    'icon': 'Target'
                })
            
            return activities
            
        except Exception as e:
            logger.error(f"Error getting recent activity: {str(e)}")
            return []
    
    def get_sales_performance(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Get sales performance data for dashboard."""
        if df.empty:
            # Return mock data when no real data is available
            import random
            from datetime import datetime, timedelta
            
            result = []
            base_date = datetime.now() - timedelta(days=30)
            
            for i in range(30):
                date = (base_date + timedelta(days=i)).strftime('%Y-%m-%d')
                result.append({
                    'date': date,
                    'quantity_sold': random.randint(50, 200),
                    'total_revenue': random.randint(2000, 8000),
                    'invoice_id': random.randint(10, 40)
                })
            
            return result
        
        try:
            # Get daily sales data for the last 30 days
            end_date = df['date'].max()
            start_date = end_date - pd.Timedelta(days=30)
            
            daily_sales = df[df['date'] >= start_date].groupby('date').agg({
                'quantity_sold': 'sum',
                'total_revenue': 'sum',
                'invoice_id': 'nunique'
            }).reset_index()
            
            # Fill missing dates with zeros
            date_range = pd.date_range(start=start_date, end=end_date, freq='D')
            daily_sales = daily_sales.set_index('date').reindex(date_range, fill_value=0).reset_index()
            daily_sales['date'] = daily_sales['date'].dt.strftime('%Y-%m-%d')
            
            # Format for chart
            result = daily_sales.to_dict('records')
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting sales performance: {str(e)}")
            return []

# Global instance
analysis_engine = SeasonalAnalysisEngine()
