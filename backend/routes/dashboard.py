"""
Dashboard routes for the Seasonal Medicine Recommendation System.
Handles dashboard data, KPI metrics, and analytics endpoints.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from flask import Blueprint, request, jsonify

from utils.utils import Logger

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api')


@dashboard_bp.route('/status', methods=['GET'])
def get_api_status():
    """Get API status and health check."""
    try:
        from models.database import get_database_status
        
        db_status = get_database_status()
        
        return jsonify({
            'status': 'running',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.2',
            'database': db_status
        })
        
    except Exception as e:
        Logger.log_error(e, "API Status")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@dashboard_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics and KPIs."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get total revenue
            cursor.execute("SELECT SUM(total_amount) FROM Sales")
            total_revenue = cursor.fetchone()[0] or 0
            
            # Get total quantity sold
            cursor.execute("SELECT SUM(quantity_sold) FROM Sales")
            total_quantity = cursor.fetchone()[0] or 0
            
            # Get unique medicines count
            cursor.execute("SELECT COUNT(DISTINCT medicine_id) FROM Sales")
            unique_medicines = cursor.fetchone()[0] or 0
            
            # Get total transactions
            cursor.execute("SELECT COUNT(DISTINCT invoice_id) FROM Sales")
            total_transactions = cursor.fetchone()[0] or 0
            
            # Get date range
            cursor.execute("SELECT MIN(date_of_sale), MAX(date_of_sale) FROM Sales")
            date_range = cursor.fetchone()
            start_date = date_range[0] if date_range[0] else None
            end_date = date_range[1] if date_range[1] else None
            
            # Calculate average daily revenue
            if start_date and end_date:
                start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                end_dt = datetime.strptime(end_date, '%Y-%m-%d')
                days_diff = (end_dt - start_dt).days + 1
                avg_daily_revenue = total_revenue / days_diff if days_diff > 0 else 0
            else:
                avg_daily_revenue = 0
            
            # Get recent performance (last 7 days vs previous 7 days)
            cursor.execute("""
                SELECT 
                    SUM(CASE WHEN date_of_sale >= date('now', '-7 days') THEN total_amount ELSE 0 END) as recent_revenue,
                    SUM(CASE WHEN date_of_sale >= date('now', '-14 days') AND date_of_sale < date('now', '-7 days') THEN total_amount ELSE 0 END) as previous_revenue
                FROM Sales
            """)
            performance_data = cursor.fetchone()
            recent_revenue = performance_data[0] or 0
            previous_revenue = performance_data[1] or 0
            
            # Calculate growth rate
            if previous_revenue > 0:
                growth_rate = ((recent_revenue - previous_revenue) / previous_revenue) * 100
            else:
                growth_rate = 0
            
            return jsonify({
                'success': True,
                'data': {
                    'total_revenue': float(total_revenue),
                    'total_quantity': int(total_quantity),
                    'unique_medicines': int(unique_medicines),
                    'total_transactions': int(total_transactions),
                    'avg_daily_revenue': float(avg_daily_revenue),
                    'growth_rate': float(growth_rate),
                    'date_range': {
                        'start': start_date,
                        'end': end_date
                    },
                    'recent_performance': {
                        'recent_revenue': float(recent_revenue),
                        'previous_revenue': float(previous_revenue)
                    }
                }
            })
            
    except Exception as e:
        Logger.log_error(e, "Dashboard Stats")
        return jsonify({
            'success': False,
            'error': 'Failed to get dashboard stats',
            'message': str(e)
        }), 500


@dashboard_bp.route('/dashboard/sales', methods=['GET'])
def get_sales_data():
    """Get sales data for dashboard charts."""
    try:
        period = request.args.get('period', '30', type=str)
        days = int(period) if period.isdigit() else 30
        
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get daily sales data
            query = """
            SELECT 
                DATE(date_of_sale) as sale_date,
                SUM(total_amount) as daily_revenue,
                SUM(quantity_sold) as daily_quantity,
                COUNT(DISTINCT invoice_id) as daily_transactions
            FROM Sales 
            WHERE date_of_sale >= date('now', '-{} days')
            GROUP BY DATE(date_of_sale)
            ORDER BY sale_date
            """.format(days)
            
            cursor.execute(query)
            results = cursor.fetchall()
            
            # Convert to list of dictionaries
            sales_data = []
            for row in results:
                sales_data.append({
                    'date': row[0],
                    'revenue': float(row[1]) if row[1] else 0,
                    'quantity': int(row[2]) if row[2] else 0,
                    'transactions': int(row[3]) if row[3] else 0
                })
            
            return jsonify({
                'success': True,
                'data': sales_data,
                'period': period
            })
            
    except Exception as e:
        Logger.log_error(e, "Sales Data")
        return jsonify({
            'success': False,
            'error': 'Failed to get sales data',
            'message': str(e)
        }), 500


@dashboard_bp.route('/dashboard/seasonal', methods=['GET'])
def get_seasonal_data():
    """Get seasonal analysis data for dashboard."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get seasonal performers data
            cursor.execute("""
                SELECT 
                    m.medicine_name,
                    SUM(CASE WHEN strftime('%m', s.date_of_sale) IN ('02', '03', '04', '05') THEN s.quantity_sold ELSE 0 END) as summer,
                    SUM(CASE WHEN strftime('%m', s.date_of_sale) IN ('06', '07', '08', '09') THEN s.quantity_sold ELSE 0 END) as monsoon,
                    SUM(CASE WHEN strftime('%m', s.date_of_sale) IN ('10', '11', '12', '01') THEN s.quantity_sold ELSE 0 END) as winter,
                    SUM(s.quantity_sold) as total
                FROM Sales s
                JOIN Medicines m ON s.medicine_id = m.medicine_id
                GROUP BY m.medicine_name
                ORDER BY total DESC
                LIMIT 10
            """)
            
            seasonal_data = cursor.fetchall()
            
            # Transform data for frontend
            seasonal_performers = []
            for row in seasonal_data:
                seasonal_performers.append({
                    'medicine': row[0],
                    'summer': int(row[1]),
                    'monsoon': int(row[2]),
                    'winter': int(row[3]),
                    'total': int(row[4])
                })
            
            return jsonify({
                'success': True,
                'data': seasonal_performers
            })
            
    except Exception as e:
        Logger.log_error(e, "Seasonal Data")
        return jsonify({
            'success': False,
            'error': 'Failed to get seasonal data',
            'message': str(e)
        }), 500


@dashboard_bp.route('/dashboard/inventory', methods=['GET'])
def get_inventory_summary():
    """Get inventory summary for dashboard."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get inventory summary
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_items,
                    SUM(CASE WHEN quantity_in_stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
                    SUM(CASE WHEN quantity_in_stock <= reorder_level THEN 1 ELSE 0 END) as low_stock,
                    SUM(quantity_in_stock * purchase_price_per_unit) as total_inventory_value
                FROM Inventory
            """)
            
            summary = cursor.fetchone()
            
            return jsonify({
                'success': True,
                'data': {
                    'total_items': summary[0] or 0,
                    'out_of_stock': summary[1] or 0,
                    'low_stock': summary[2] or 0,
                    'total_value': float(summary[3]) if summary[3] else 0
                }
            })
            
    except Exception as e:
        Logger.log_error(e, "Inventory Summary")
        return jsonify({
            'success': False,
            'error': 'Failed to get inventory summary',
            'message': str(e)
        }), 500
