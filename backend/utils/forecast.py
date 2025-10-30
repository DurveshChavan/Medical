"""
Forecasting utilities for Advanced Analytics.
Implements SARIMA and Prophet forecasting models based on Engine.py logic.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import logging

try:
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    from prophet import Prophet
    FORECASTING_AVAILABLE = True
except ImportError:
    FORECASTING_AVAILABLE = False
    logging.warning("Forecasting libraries not available. Install statsmodels and prophet.")

logger = logging.getLogger(__name__)

class ForecastingEngine:
    """Forecasting engine for time-series analysis."""
    
    def __init__(self):
        self.available = FORECASTING_AVAILABLE
    
    def get_season(self, month: int) -> str:
        """Map month to season based on Indian climate."""
        if month in [2, 3, 4, 5]:
            return 'summer'
        elif month in [6, 7, 8, 9]:
            return 'monsoon'
        else:  # [10, 11, 12, 1]
            return 'winter'
    
    def prepare_time_series_data(self, sales_data: List[Tuple], medicine_name: str) -> pd.DataFrame:
        """
        Prepare time series data from sales records.
        
        Args:
            sales_data: List of (date, quantity) tuples
            medicine_name: Name of the medicine
            
        Returns:
            DataFrame with date and quantity columns
        """
        if not sales_data:
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(sales_data, columns=['date', 'quantity'])
        df['date'] = pd.to_datetime(df['date'])
        
        # Aggregate by date (sum quantities for same date)
        df = df.groupby('date')['quantity'].sum().reset_index()
        
        # Sort by date
        df = df.sort_values('date')
        
        # Add seasonal information
        df['month'] = df['date'].dt.month
        df['season'] = df['month'].apply(self.get_season)
        
        return df
    
    def generate_sarima_forecast(self, df: pd.DataFrame, forecast_weeks: int = 12) -> Dict[str, Any]:
        """
        Generate SARIMA forecast for medicine sales.
        
        Args:
            df: DataFrame with date and quantity columns
            forecast_weeks: Number of weeks to forecast ahead
            
        Returns:
            Dictionary with forecast data
        """
        if not self.available or df.empty or len(df) < 24:
            return {
                'success': False,
                'error': 'Insufficient data for SARIMA forecast (minimum 24 weeks required)',
                'historical_dates': [],
                'historical_quantities': [],
                'forecast_dates': [],
                'forecast_values': [],
                'lower_bound': [],
                'upper_bound': []
            }
        
        try:
            # Resample to weekly data (Monday as week start)
            weekly_data = df.set_index('date')['quantity'].resample('W-Mon').sum()
            
            if len(weekly_data) < 24:
                return {
                    'success': False,
                    'error': f'Insufficient weekly data for SARIMA forecast ({len(weekly_data)} weeks)',
                    'historical_dates': [],
                    'historical_quantities': [],
                    'forecast_dates': [],
                    'forecast_values': [],
                    'lower_bound': [],
                    'upper_bound': []
                }
            
            # Fit SARIMA model (same parameters as Engine.py)
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
            
            # Prepare historical data
            historical_dates = [d.strftime('%Y-%m-%d') for d in weekly_data.index]
            historical_quantities = weekly_data.values.tolist()
            
            # Prepare forecast data
            forecast_dates = [d.strftime('%Y-%m-%d') for d in forecast_mean.index]
            forecast_values = forecast_mean.values.tolist()
            lower_bound = forecast_ci.iloc[:, 0].values.tolist()
            upper_bound = forecast_ci.iloc[:, 1].values.tolist()
            
            return {
                'success': True,
                'historical_dates': historical_dates,
                'historical_quantities': historical_quantities,
                'forecast_dates': forecast_dates,
                'forecast_values': forecast_values,
                'lower_bound': lower_bound,
                'upper_bound': upper_bound
            }
            
        except Exception as e:
            logger.error(f"SARIMA forecast error: {str(e)}")
            return {
                'success': False,
                'error': f'SARIMA forecast failed: {str(e)}',
                'historical_dates': [],
                'historical_quantities': [],
                'forecast_dates': [],
                'forecast_values': [],
                'lower_bound': [],
                'upper_bound': []
            }
    
    def generate_prophet_forecast(self, df: pd.DataFrame, forecast_months: int = 3) -> Dict[str, Any]:
        """
        Generate Prophet forecast for medicine sales.
        
        Args:
            df: DataFrame with date and quantity columns
            forecast_months: Number of months to forecast ahead
            
        Returns:
            Dictionary with forecast data
        """
        if not self.available or df.empty or len(df) < 30:
            return {
                'success': False,
                'error': 'Insufficient data for Prophet forecast (minimum 30 days required)',
                'dates': [],
                'actual': [],
                'forecast': [],
                'lower': [],
                'upper': [],
                'yearly_seasonality': []
            }
        
        try:
            # Prepare data for Prophet (requires 'ds' and 'y' columns)
            prophet_df = df[['date', 'quantity']].copy()
            prophet_df.columns = ['ds', 'y']
            
            # Fit Prophet model (same parameters as Engine.py)
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_mode='multiplicative',
                interval_width=0.95
            )
            
            model.fit(prophet_df)
            
            # Create future dataframe
            future = model.make_future_dataframe(periods=forecast_months * 30, freq='D')
            forecast = model.predict(future)
            
            # Extract historical and future data
            historical_mask = forecast['ds'] <= df['date'].max()
            future_mask = forecast['ds'] > df['date'].max()
            
            # Historical data
            historical_dates = [d.strftime('%Y-%m-%d') for d in forecast[historical_mask]['ds']]
            historical_actual = df['quantity'].tolist()
            historical_forecast = forecast[historical_mask]['yhat'].tolist()
            
            # Future forecast data
            future_dates = [d.strftime('%Y-%m-%d') for d in forecast[future_mask]['ds']]
            future_forecast = forecast[future_mask]['yhat'].tolist()
            future_lower = forecast[future_mask]['yhat_lower'].tolist()
            future_upper = forecast[future_mask]['yhat_upper'].tolist()
            
            # Combine historical and future
            all_dates = historical_dates + future_dates
            all_actual = historical_actual + [None] * len(future_dates)
            all_forecast = historical_forecast + future_forecast
            all_lower = [None] * len(historical_dates) + future_lower
            all_upper = [None] * len(historical_dates) + future_upper
            
            # Extract yearly seasonality
            yearly_seasonality = forecast['yearly'].tolist()
            
            return {
                'success': True,
                'dates': all_dates,
                'actual': all_actual,
                'forecast': all_forecast,
                'lower': all_lower,
                'upper': all_upper,
                'yearly_seasonality': yearly_seasonality
            }
            
        except Exception as e:
            logger.error(f"Prophet forecast error: {str(e)}")
            return {
                'success': False,
                'error': f'Prophet forecast failed: {str(e)}',
                'dates': [],
                'actual': [],
                'forecast': [],
                'lower': [],
                'upper': [],
                'yearly_seasonality': []
            }
    
    
    def process_medicine_forecasts(self, medicine_id: int, medicine_name: str, sales_data: List[Tuple]) -> Dict[str, Any]:
        """
        Process all forecasts for a single medicine.
        
        Args:
            medicine_id: ID of the medicine
            medicine_name: Name of the medicine
            sales_data: List of (date, quantity) tuples
            
        Returns:
            Dictionary with all forecast data for the medicine
        """
        # Prepare time series data
        df = self.prepare_time_series_data(sales_data, medicine_name)
        
        if df.empty:
            return {
                'medicine_id': medicine_id,
                'medicine_name': medicine_name,
                'total_quantity': 0,
                'sales_trends': {
                    'dates': [],
                    'quantities': [],
                    'seasons': []
                },
                'sarima_forecast': {
                    'success': False,
                    'error': 'No sales data available'
                },
                'prophet_forecast': {
                    'success': False,
                    'error': 'No sales data available'
                },
                'seasonal_pattern': {
                    'dates': [],
                    'seasonal_effect': []
                }
            }
        
        # Calculate total quantity
        total_quantity = df['quantity'].sum()
        
        # Prepare sales trends data (weekly aggregation)
        weekly_trends = df.set_index('date')['quantity'].resample('W-Mon').sum()
        sales_trends = {
            'dates': [d.strftime('%Y-%m-%d') for d in weekly_trends.index],
            'quantities': weekly_trends.values.tolist(),
            'seasons': [self.get_season(d.month) for d in weekly_trends.index]
        }
        
        # Generate forecasts
        sarima_forecast = self.generate_sarima_forecast(df)
        prophet_forecast = self.generate_prophet_forecast(df)
        
        return {
            'medicine_id': medicine_id,
            'medicine_name': medicine_name,
            'total_quantity': int(total_quantity),
            'sales_trends': sales_trends,
            'sarima_forecast': sarima_forecast,
            'prophet_forecast': prophet_forecast
        }

# Global forecasting engine instance
forecasting_engine = ForecastingEngine()
