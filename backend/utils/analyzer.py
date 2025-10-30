"""
Analytical module containing all statistical and reporting logic.
Contains all real analytical, statistical, or reporting logic from Engine.py.
"""

import pandas as pd
import numpy as np
import json
import warnings
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path

# Import visualization libraries with fallbacks
try:
    import matplotlib.pyplot as plt
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False
    print("Warning: matplotlib not available. Visualization disabled.")

try:
    import seaborn as sns
    SEABORN_AVAILABLE = True
except ImportError:
    SEABORN_AVAILABLE = False
    print("Warning: seaborn not available. Advanced styling disabled.")

# Import forecasting libraries
try:
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    SARIMAX_AVAILABLE = True
except ImportError:
    SARIMAX_AVAILABLE = False
    print("Warning: statsmodels not available. SARIMA forecasting disabled.")

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("Warning: prophet not available. Prophet forecasting disabled.")

from config import (
    OUTPUT_DIR, SEASONS, ANALYSIS_CONFIG, CHART_CONFIG, 
    PRIORITY_LEVELS, OUTPUT_PATTERNS
)
from models.database import get_database_manager
from .utils import Logger, FileManager, DataProcessor

# Configure settings
warnings.filterwarnings('ignore')
if SEABORN_AVAILABLE:
    sns.set_style(CHART_CONFIG['style'])
if MATPLOTLIB_AVAILABLE:
    plt.rcParams['figure.figsize'] = CHART_CONFIG['figure_size']

logger = logging.getLogger(__name__)


class SeasonalAnalyzer:
    """Handles seasonal analysis and pattern detection."""
    
    def __init__(self):
        self.db_manager = get_database_manager()
        self.data_processor = DataProcessor()
    
    def get_seasonal_sales_data(self) -> pd.DataFrame:
        """
        Get seasonal sales data from database.
        
        Returns:
            pd.DataFrame: Seasonal sales data
        """
        try:
            with self.db_manager.get_connection() as conn:
                query = """
                    SELECT 
                        date, medicine_name, quantity, total_sales, invoice_id,
                        CASE 
                            WHEN strftime('%m', date) IN ('02', '03', '04', '05') THEN 'Summer'
                            WHEN strftime('%m', date) IN ('06', '07', '08', '09') THEN 'Monsoon'
                            ELSE 'Winter'
                        END as season
                    FROM sales
                    ORDER BY date
                """
                return pd.read_sql_query(query, conn)
        except Exception as e:
            Logger.log_error(e, "Seasonal Sales Data Retrieval")
            return pd.DataFrame()
    
    def analyze_seasonal_patterns(self) -> Dict[str, Any]:
        """
        Analyze seasonal sales patterns.
        
        Returns:
            Dict[str, Any]: Seasonal analysis results
        """
        Logger.log_analysis_start("Seasonal Pattern Analysis", {})
        
        try:
            df = self.get_seasonal_sales_data()
            if df.empty:
                return {'error': 'No data available for seasonal analysis'}
            
            # Group by season
            seasonal_summary = df.groupby('season').agg({
                'quantity': 'sum',
                'total_sales': 'sum',
                'invoice_id': 'nunique',
                'medicine_name': 'nunique'
            }).reindex(['Summer', 'Monsoon', 'Winter'])
            
            seasonal_summary.columns = ['Total_Quantity', 'Total_Revenue_INR', 'Unique_Invoices', 'Unique_Medicines']
            
            # Calculate percentages
            total_qty = seasonal_summary['Total_Quantity'].sum()
            total_rev = seasonal_summary['Total_Revenue_INR'].sum()
            
            seasonal_summary['Quantity_Percentage'] = (seasonal_summary['Total_Quantity'] / total_qty * 100).round(2)
            seasonal_summary['Revenue_Percentage'] = (seasonal_summary['Total_Revenue_INR'] / total_rev * 100).round(2)
            
            results = {
                'seasonal_summary': seasonal_summary.to_dict('index'),
                'total_records': len(df),
                'date_range': {
                    'start': df['date'].min(),
                    'end': df['date'].max()
                },
                'analysis_timestamp': datetime.now().isoformat()
            }
            
            Logger.log_analysis_complete("Seasonal Pattern Analysis", results)
            return results
            
        except Exception as e:
            Logger.log_error(e, "Seasonal Pattern Analysis")
            return {'error': str(e)}
    
    def get_top_medicines_by_season(self, season: str, top_n: int = 10) -> pd.DataFrame:
        """
        Get top medicines for a specific season.
        
        Args:
            season (str): Season name
            top_n (int): Number of top medicines to return
            
        Returns:
            pd.DataFrame: Top medicines for the season
        """
        try:
            with self.db_manager.get_connection() as conn:
                query = """
                    SELECT 
                        medicine_name,
                        SUM(quantity) as total_quantity,
                        SUM(total_sales) as total_revenue,
                        COUNT(DISTINCT invoice_id) as unique_orders,
                        AVG(unit_price) as avg_unit_price
                    FROM sales
                    WHERE CASE 
                        WHEN strftime('%m', date) IN ('02', '03', '04', '05') THEN 'Summer'
                        WHEN strftime('%m', date) IN ('06', '07', '08', '09') THEN 'Monsoon'
                        ELSE 'Winter'
                    END = ?
                    GROUP BY medicine_name
                    ORDER BY total_quantity DESC
                    LIMIT ?
                """
                return pd.read_sql_query(query, conn, params=[season, top_n])
        except Exception as e:
            Logger.log_error(e, f"Top Medicines for {season}")
            return pd.DataFrame()


class RecommendationEngine:
    """Generates seasonal recommendations based on historical data."""
    
    def __init__(self):
        self.db_manager = get_database_manager()
        self.data_processor = DataProcessor()
    
    def generate_heuristic_recommendations(self, target_season: str, buffer: float = 0.15) -> pd.DataFrame:
        """
        Generate stock recommendations based on historical seasonal data.
        
        Args:
            target_season (str): Target season for recommendations
            buffer (float): Safety stock buffer percentage
            
        Returns:
            pd.DataFrame: Recommendations with rankings and suggested stock quantities
        """
        Logger.log_analysis_start("Heuristic Recommendations", {
            "target_season": target_season,
            "buffer": buffer
        })
        
        try:
            # Get historical data for target season
            with self.db_manager.get_connection() as conn:
                query = """
                    SELECT 
                        medicine_name,
                        SUM(quantity) as last_season_sales,
                        SUM(total_sales) as total_revenue,
                        COUNT(DISTINCT invoice_id) as unique_orders,
                        AVG(unit_price) as avg_unit_price
                    FROM sales
                    WHERE CASE 
                        WHEN strftime('%m', date) IN ('02', '03', '04', '05') THEN 'Summer'
                        WHEN strftime('%m', date) IN ('06', '07', '08', '09') THEN 'Monsoon'
                        ELSE 'Winter'
                    END = ?
                    GROUP BY medicine_name
                    ORDER BY last_season_sales DESC
                """
                df = pd.read_sql_query(query, conn, params=[target_season])
            
            if df.empty:
                logger.warning(f"No historical data found for season: {target_season}")
                return pd.DataFrame()
            
            # Calculate suggested stock quantity with buffer
            df['suggested_stock_quantity'] = (df['last_season_sales'] * (1 + buffer)).astype(int)
            
            # Calculate daily average (assuming ~90 days per season)
            days_in_season = SEASONS[target_season]['duration_days']
            df['daily_avg_sales'] = (df['last_season_sales'] / days_in_season).round(2)
            
            # Add rank
            df['rank'] = range(1, len(df) + 1)
            
            # Identify fast movers (top 25th percentile)
            fast_mover_threshold = df['daily_avg_sales'].quantile(ANALYSIS_CONFIG['fast_mover_threshold'])
            df['is_fast_mover'] = df['daily_avg_sales'] >= fast_mover_threshold
            
            results = {
                'total_medicines': len(df),
                'fast_movers': df['is_fast_mover'].sum(),
                'total_predicted_demand': df['suggested_stock_quantity'].sum(),
                'total_estimated_revenue': df['total_revenue'].sum()
            }
            
            Logger.log_analysis_complete("Heuristic Recommendations", results)
            return df
            
        except Exception as e:
            Logger.log_error(e, "Heuristic Recommendations")
            return pd.DataFrame()
    
    def categorize_by_priority(self, recommendations_df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
        """
        Categorize medicines into priority levels for ordering.
        
        Args:
            recommendations_df (pd.DataFrame): Recommendations DataFrame
            
        Returns:
            Dict[str, pd.DataFrame]: Categorized medicines by priority
        """
        if recommendations_df.empty:
            return {}
        
        categorized = {}
        total_medicines = len(recommendations_df)
        
        # Priority A: Top 20% (Critical - Must Stock)
        critical_count = max(int(total_medicines * PRIORITY_LEVELS['CRITICAL']), 1)
        critical_df = recommendations_df.head(critical_count).copy()
        critical_df['priority_level'] = 'CRITICAL'
        critical_df['action'] = 'MUST ORDER IMMEDIATELY'
        categorized['CRITICAL'] = critical_df
        
        # Priority B: Next 30% (High Priority - Recommended)
        high_count = max(int(total_medicines * PRIORITY_LEVELS['HIGH']), 1)
        high_df = recommendations_df.iloc[critical_count:critical_count + high_count].copy()
        high_df['priority_level'] = 'HIGH'
        high_df['action'] = 'ORDER RECOMMENDED'
        categorized['HIGH'] = high_df
        
        # Priority C: Next 30% (Medium Priority - Optional)
        medium_count = max(int(total_medicines * PRIORITY_LEVELS['MEDIUM']), 1)
        medium_df = recommendations_df.iloc[critical_count + high_count:critical_count + high_count + medium_count].copy()
        medium_df['priority_level'] = 'MEDIUM'
        medium_df['action'] = 'ORDER IF BUDGET ALLOWS'
        categorized['MEDIUM'] = medium_df
        
        # Priority D: Remaining 20% (Low Priority)
        low_df = recommendations_df.iloc[critical_count + high_count + medium_count:].copy()
        low_df['priority_level'] = 'LOW'
        low_df['action'] = 'STOCK ON DEMAND'
        categorized['LOW'] = low_df
        
        return categorized
    


class ForecastingEngine:
    """Handles time series forecasting using SARIMA and Prophet models."""
    
    def __init__(self):
        self.db_manager = get_database_manager()
    
    def get_medicine_time_series(self, medicine_name: str) -> pd.DataFrame:
        """
        Get time series data for a specific medicine.
        
        Args:
            medicine_name (str): Medicine name
            
        Returns:
            pd.DataFrame: Time series data
        """
        try:
            with self.db_manager.get_connection() as conn:
                query = """
                    SELECT 
                        date,
                        SUM(quantity) as quantity
                    FROM sales
                    WHERE medicine_name = ?
                    GROUP BY date
                    ORDER BY date
                """
                return pd.read_sql_query(query, conn, params=[medicine_name])
        except Exception as e:
            Logger.log_error(e, f"Time Series for {medicine_name}")
            return pd.DataFrame()
    
    def forecast_sarima(self, medicine_name: str, forecast_weeks: int = 12) -> Optional[pd.DataFrame]:
        """
        Generate SARIMA forecast for a medicine.
        
        Args:
            medicine_name (str): Medicine name
            forecast_weeks (int): Number of weeks to forecast
            
        Returns:
            Optional[pd.DataFrame]: Forecast results
        """
        if not SARIMAX_AVAILABLE:
            logger.warning("SARIMAX not available. Skipping SARIMA forecast.")
            return None
        
        Logger.log_analysis_start("SARIMA Forecast", {
            "medicine": medicine_name,
            "forecast_weeks": forecast_weeks
        })
        
        try:
            # Get time series data
            ts_data = self.get_medicine_time_series(medicine_name)
            if ts_data.empty:
                logger.warning(f"No time series data found for {medicine_name}")
                return None
            
            # Convert to weekly data
            ts_data['date'] = pd.to_datetime(ts_data['date'])
            ts_data = ts_data.set_index('date')
            weekly_data = ts_data['quantity'].resample('W-Mon').sum()
            
            if len(weekly_data) < ANALYSIS_CONFIG['min_data_points_sarima']:
                logger.warning(f"Insufficient data for SARIMA: {len(weekly_data)} weeks")
                return None
            
            # Fit SARIMA model
            model = SARIMAX(
                weekly_data,
                order=(1, 1, 1),
                seasonal_order=(1, 1, 0, 12),
                enforce_stationarity=False,
                enforce_invertibility=False
            ).fit(disp=False)
            
            # Generate forecast
            forecast = model.get_forecast(steps=forecast_weeks)
            forecast_mean = forecast.predicted_mean
            forecast_ci = forecast.conf_int()
            
            # Create forecast DataFrame
            forecast_df = pd.DataFrame({
                'Week_Ending': forecast_mean.index,
                'Predicted_Quantity': forecast_mean.values.round(0).astype(int),
                'Lower_Bound': forecast_ci.iloc[:, 0].values.round(0).astype(int),
                'Upper_Bound': forecast_ci.iloc[:, 1].values.round(0).astype(int)
            })
            
            Logger.log_analysis_complete("SARIMA Forecast", {
                "forecast_weeks": len(forecast_df),
                "total_forecast": forecast_df['Predicted_Quantity'].sum()
            })
            
            return forecast_df
            
        except Exception as e:
            Logger.log_error(e, "SARIMA Forecast")
            return None
    
    def forecast_prophet(self, medicine_name: str, forecast_months: int = 3) -> Optional[pd.DataFrame]:
        """
        Generate Prophet forecast for a medicine.
        
        Args:
            medicine_name (str): Medicine name
            forecast_months (int): Number of months to forecast
            
        Returns:
            Optional[pd.DataFrame]: Forecast results
        """
        if not PROPHET_AVAILABLE:
            logger.warning("Prophet not available. Skipping Prophet forecast.")
            return None
        
        Logger.log_analysis_start("Prophet Forecast", {
            "medicine": medicine_name,
            "forecast_months": forecast_months
        })
        
        try:
            # Get time series data
            ts_data = self.get_medicine_time_series(medicine_name)
            if ts_data.empty:
                logger.warning(f"No time series data found for {medicine_name}")
                return None
            
            # Prepare data for Prophet
            daily_sales = ts_data.groupby('date')['quantity'].sum().reset_index()
            daily_sales.columns = ['ds', 'y']
            
            if len(daily_sales) < ANALYSIS_CONFIG['min_data_points_prophet']:
                logger.warning(f"Insufficient data for Prophet: {len(daily_sales)} days")
                return None
            
            # Fit Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_mode='multiplicative',
                interval_width=0.95
            )
            
            model.fit(daily_sales)
            
            # Create future dataframe
            future = model.make_future_dataframe(periods=forecast_months * 30, freq='D')
            forecast = model.predict(future)
            
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
            
            Logger.log_analysis_complete("Prophet Forecast", {
                "forecast_months": len(monthly_forecast),
                "total_forecast": monthly_forecast['Predicted_Quantity'].sum()
            })
            
            return monthly_forecast
            
        except Exception as e:
            Logger.log_error(e, "Prophet Forecast")
            return None
    


class VisualizationEngine:
    """Handles chart generation and visualization."""
    
    def __init__(self):
        self.output_dir = OUTPUT_DIR
        self.output_dir.mkdir(exist_ok=True)
    
    def create_seasonal_overview_chart(self, seasonal_data: Dict[str, Any]) -> Path:
        """
        Create seasonal sales overview chart.
        
        Args:
            seasonal_data (Dict[str, Any]): Seasonal analysis data
            
        Returns:
            Path: Path to saved chart
        """
        if not MATPLOTLIB_AVAILABLE:
            logger.warning("Matplotlib not available. Skipping chart creation.")
            return None
            
        try:
            seasonal_summary = seasonal_data['seasonal_summary']
            seasons_order = ['Summer', 'Monsoon', 'Winter']
            colors = [CHART_CONFIG['colors']['summer'], 
                     CHART_CONFIG['colors']['monsoon'], 
                     CHART_CONFIG['colors']['winter']]
            
            fig, axes = plt.subplots(1, 2, figsize=(16, 6))
            
            # Subplot 1: Quantity by Season
            ax1 = axes[0]
            seasonal_qty = [seasonal_summary[season]['Total_Quantity'] for season in seasons_order]
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
            seasonal_rev = [seasonal_summary[season]['Total_Revenue_INR'] for season in seasons_order]
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
            chart_path = self.output_dir / OUTPUT_PATTERNS['seasonal_overview']
            plt.savefig(chart_path, dpi=CHART_CONFIG['dpi'], bbox_inches='tight')
            plt.close()
            
            logger.info(f"Seasonal overview chart saved: {chart_path}")
            return chart_path
            
        except Exception as e:
            Logger.log_error(e, "Seasonal Overview Chart")
            return None


class AnalysisOrchestrator:
    """Main analysis orchestrator that coordinates all analytical processes."""
    
    def __init__(self):
        self.seasonal_analyzer = SeasonalAnalyzer()
        self.recommendation_engine = RecommendationEngine()
        self.forecasting_engine = ForecastingEngine()
        self.visualization_engine = VisualizationEngine()
    
    def run_complete_analysis(self, target_season: str = 'Winter', forecast_top_n: int = 3) -> Dict[str, Any]:
        """
        Run complete analysis pipeline.
        
        Args:
            target_season (str): Target season for recommendations
            forecast_top_n (int): Number of top medicines to forecast
            
        Returns:
            Dict[str, Any]: Complete analysis results
        """
        Logger.log_analysis_start("Complete Analysis", {
            "target_season": target_season,
            "forecast_top_n": forecast_top_n
        })
        
        results = {
            'success': False,
            'seasonal_analysis': {},
            'recommendations': {},
            'forecasts': {},
            'visualizations': {},
            'errors': [],
            'warnings': []
        }
        
        try:
            # Step 1: Seasonal Analysis
            seasonal_results = self.seasonal_analyzer.analyze_seasonal_patterns()
            if 'error' in seasonal_results:
                results['errors'].append(seasonal_results['error'])
            else:
                results['seasonal_analysis'] = seasonal_results
            
            # Step 2: Generate Recommendations
            recommendations = self.recommendation_engine.generate_heuristic_recommendations(target_season)
            if not recommendations.empty:
                results['recommendations'] = {
                    'data': recommendations.to_dict('records'),
                    'total_medicines': len(recommendations),
                    'fast_movers': recommendations['is_fast_mover'].sum(),
                    'total_predicted_demand': recommendations['suggested_stock_quantity'].sum(),
                    'total_estimated_revenue': recommendations['total_revenue'].sum()
                }
                
                # Categorize by priority
                categorized = self.recommendation_engine.categorize_by_priority(recommendations)
                results['recommendations']['categorized'] = {
                    level: df.to_dict('records') for level, df in categorized.items()
                }
            else:
                results['errors'].append(f"No recommendations generated for {target_season}")
            
            # Step 3: Generate Forecasts (if requested)
            if forecast_top_n > 0 and not recommendations.empty:
                top_medicines = recommendations.head(forecast_top_n)['medicine_name'].tolist()
                forecasts = {}
                
                for medicine in top_medicines:
                    # SARIMA forecast
                    sarima_forecast = self.forecasting_engine.forecast_sarima(medicine)
                    if sarima_forecast is not None:
                        forecasts[f"{medicine}_SARIMA"] = sarima_forecast.to_dict('records')
                    
                    # Prophet forecast
                    prophet_forecast = self.forecasting_engine.forecast_prophet(medicine)
                    if prophet_forecast is not None:
                        forecasts[f"{medicine}_Prophet"] = prophet_forecast.to_dict('records')
                
                results['forecasts'] = forecasts
            
            # Step 4: Generate Visualizations
            if 'seasonal_summary' in seasonal_results:
                chart_path = self.visualization_engine.create_seasonal_overview_chart(seasonal_results)
                if chart_path:
                    results['visualizations']['seasonal_overview'] = str(chart_path)
            
            results['success'] = len(results['errors']) == 0
            
            Logger.log_analysis_complete("Complete Analysis", {
                "success": results['success'],
                "recommendations_count": len(recommendations) if not recommendations.empty else 0,
                "forecasts_count": len(results['forecasts'])
            })
            
        except Exception as e:
            Logger.log_error(e, "Complete Analysis")
            results['errors'].append(str(e))
        
        return results


def run_analysis(target_season: str = 'Winter', forecast_top_n: int = 3) -> Dict[str, Any]:
    """
    Run complete analysis.
    
    Args:
        target_season (str): Target season for recommendations
        forecast_top_n (int): Number of top medicines to forecast
        
    Returns:
        Dict[str, Any]: Analysis results
    """
    orchestrator = AnalysisOrchestrator()
    return orchestrator.run_complete_analysis(target_season, forecast_top_n)
