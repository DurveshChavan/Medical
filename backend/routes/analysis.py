"""
Analysis routes for the Seasonal Medicine Recommendation System.
Handles all analysis-related endpoints including seasonal data, KPI metrics, and analytics.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from flask import Blueprint, request, jsonify

from utils.analysis_engine import analysis_engine
from utils.forecast import forecasting_engine
from utils.utils import Logger

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/analysis')


@analysis_bp.route('/seasonal-summary', methods=['GET'])
def get_seasonal_summary():
    """Get seasonal sales summary."""
    try:
        df = analysis_engine.load_sales_data()
        summary = analysis_engine.get_seasonal_summary(df)
        
        return jsonify({
            'success': True,
            'data': summary
        })
        
    except Exception as e:
        Logger.log_error(e, "Seasonal Summary")
        return jsonify({
            'success': False,
            'error': 'Failed to get seasonal summary',
            'message': str(e)
        }), 500


@analysis_bp.route('/top-medicines/<season>', methods=['GET'])
def get_top_medicines(season):
    """Get top medicines for a specific season."""
    try:
        df = analysis_engine.load_sales_data()
        top_n = request.args.get('top_n', 10, type=int)
        medicines = analysis_engine.get_top_medicines_by_season(df, season, top_n)
        
        return jsonify({
            'success': True,
            'season': season,
            'medicines': medicines
        })
        
    except Exception as e:
        Logger.log_error(e, f"Top Medicines for {season}")
        return jsonify({
            'success': False,
            'error': f'Failed to get top medicines for {season}',
            'message': str(e)
        }), 500


@analysis_bp.route('/recommendations/<season>', methods=['GET'])
def get_analysis_recommendations(season):
    """Get seasonal recommendations."""
    try:
        df = analysis_engine.load_sales_data()
        buffer = request.args.get('buffer', 0.15, type=float)
        recommendations = analysis_engine.get_seasonal_recommendations(df, season, buffer)
        
        return jsonify({
            'success': True,
            'season': season,
            'recommendations': recommendations
        })
        
    except Exception as e:
        Logger.log_error(e, f"Recommendations for {season}")
        return jsonify({
            'success': False,
            'error': f'Failed to get recommendations for {season}',
            'message': str(e)
        }), 500


@analysis_bp.route('/trends', methods=['GET'])
def get_medicine_trends():
    """Get medicine trends analysis."""
    try:
        df = analysis_engine.load_sales_data()
        top_n = request.args.get('top_n', 5, type=int)
        trends = analysis_engine.get_medicine_trends(df, top_n)
        
        return jsonify({
            'success': True,
            'trends': trends
        })
        
    except Exception as e:
        Logger.log_error(e, "Medicine Trends")
        return jsonify({
            'success': False,
            'error': 'Failed to get medicine trends',
            'message': str(e)
        }), 500


@analysis_bp.route('/categories', methods=['GET'])
def get_category_analysis():
    """Get category analysis."""
    try:
        df = analysis_engine.load_sales_data()
        analysis = analysis_engine.get_category_analysis(df)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        Logger.log_error(e, "Category Analysis")
        return jsonify({
            'success': False,
            'error': 'Failed to get category analysis',
            'message': str(e)
        }), 500


@analysis_bp.route('/ordering-guide/<season>', methods=['GET'])
def get_ordering_guide(season):
    """Get ordering guide for a season."""
    try:
        df = analysis_engine.load_sales_data()
        recommendations = analysis_engine.get_seasonal_recommendations(df, season)
        guide = analysis_engine.generate_ordering_guide(recommendations, season)
        
        return jsonify({
            'success': True,
            'season': season,
            'guide': guide,
            'recommendations': recommendations
        })
        
    except Exception as e:
        Logger.log_error(e, f"Ordering Guide for {season}")
        return jsonify({
            'success': False,
            'error': f'Failed to get ordering guide for {season}',
            'message': str(e)
        }), 500


@analysis_bp.route('/seasonal-performers', methods=['GET'])
def get_seasonal_performers():
    """Get seasonal performers data for enhanced analytics."""
    try:
        df = analysis_engine.load_sales_data()
        performers = analysis_engine.get_seasonal_performers(df)
        return jsonify({
            'success': True,
            'data': performers
        })
        
    except Exception as e:
        Logger.log_error(e, "Seasonal performers analysis")
        return jsonify({
            'success': False,
            'error': 'Failed to get seasonal performers',
            'message': str(e)
        }), 500


@analysis_bp.route('/seasonal-data/<season>', methods=['GET'])
def get_seasonal_data(season):
    """Get comprehensive seasonal data for a specific season."""
    try:
        # Validate season parameter
        valid_seasons = ['summer', 'monsoon', 'winter', 'all']
        if season not in valid_seasons:
            return jsonify({
                'success': False,
                'error': 'Invalid season',
                'message': f'Season must be one of: {valid_seasons}'
            }), 400
        
        # Use dynamic database state
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        # Create database manager with active database path
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get seasonal performers data
            if season == 'all':
                seasonal_performers_query = """
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
                LIMIT 20
                """
            else:
                # Map season to months (matching Engine.py)
                season_months = {
                    'summer': "('02', '03', '04', '05')",
                    'monsoon': "('06', '07', '08', '09')",
                    'winter': "('10', '11', '12', '01')"
                }
                
                seasonal_performers_query = f"""
                SELECT 
                    m.medicine_name,
                    SUM(CASE WHEN strftime('%m', s.date_of_sale) IN {season_months[season]} THEN s.quantity_sold ELSE 0 END) as {season},
                    SUM(s.quantity_sold) as total
                FROM Sales s
                JOIN Medicines m ON s.medicine_id = m.medicine_id
                WHERE strftime('%m', s.date_of_sale) IN {season_months[season]}
                GROUP BY m.medicine_name
                ORDER BY total DESC
                LIMIT 20
                """
            
            cursor.execute(seasonal_performers_query)
            seasonal_performers = cursor.fetchall()
            
            # Get fast movers data with real inventory
            fast_movers_query = """
            SELECT 
                m.medicine_name,
                SUM(s.quantity_sold) as total_quantity,
                COUNT(DISTINCT s.invoice_id) as unique_orders,
                SUM(s.quantity_sold) / COUNT(DISTINCT DATE(s.date_of_sale)) as avg_daily_sales,
                SUM(s.total_amount) as total_revenue,
                COALESCE(MAX(i.quantity_in_stock), 0) as current_stock,
                COALESCE(MAX(i.reorder_level), 10) as reorder_level
            FROM Sales s
            JOIN Medicines m ON s.medicine_id = m.medicine_id
            LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id
            GROUP BY m.medicine_name
            HAVING total_quantity > 100 AND unique_orders > 10
            ORDER BY total_quantity DESC
            LIMIT 10
            """
            cursor.execute(fast_movers_query)
            fast_movers = cursor.fetchall()
            
            # Get top medicines
            top_medicines_query = """
            SELECT 
                m.medicine_name,
                SUM(s.quantity_sold) as quantity_sold,
                SUM(s.total_amount) as total_revenue,
                COUNT(DISTINCT s.invoice_id) as unique_orders,
                AVG(s.unit_price_at_sale) as avg_price
            FROM Sales s
            JOIN Medicines m ON s.medicine_id = m.medicine_id
            GROUP BY m.medicine_name
            ORDER BY quantity_sold DESC
            LIMIT 15
            """
            cursor.execute(top_medicines_query)
            top_medicines = cursor.fetchall()
            
            # Get enhanced medicines data with real inventory
            enhanced_medicines_query = """
            SELECT 
                m.medicine_name,
                m.category,
                SUM(s.quantity_sold) as total_quantity,
                SUM(s.total_amount) as total_revenue,
                COUNT(DISTINCT s.invoice_id) as unique_orders,
                AVG(s.unit_price_at_sale) as avg_price,
                COALESCE(MAX(i.quantity_in_stock), 0) as current_stock,
                COALESCE(MAX(i.reorder_level), 10) as reorder_level,
                COALESCE(AVG(i.purchase_price_per_unit), 0) as purchase_price
            FROM Sales s
            JOIN Medicines m ON s.medicine_id = m.medicine_id
            LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id
            GROUP BY m.medicine_name, m.category
            ORDER BY total_revenue DESC
            LIMIT 25
            """
            cursor.execute(enhanced_medicines_query)
            enhanced_medicines = cursor.fetchall()
            
            # Get week plans based on real sales data and inventory levels
            week_plans_query = """
            SELECT 
                m.medicine_name,
                SUM(s.quantity_sold) as total_sold,
                SUM(s.total_amount) as total_revenue,
                COALESCE(MAX(i.quantity_in_stock), 0) as current_stock,
                COALESCE(MAX(i.reorder_level), 10) as reorder_level,
                CASE 
                    WHEN COALESCE(MAX(i.quantity_in_stock), 0) = 0 THEN 'critical'
                    WHEN COALESCE(MAX(i.quantity_in_stock), 0) <= COALESCE(MAX(i.reorder_level), 10) THEN 'high'
                    WHEN COALESCE(MAX(i.quantity_in_stock), 0) <= COALESCE(MAX(i.reorder_level), 10) * 2 THEN 'medium'
                    ELSE 'low'
                END as priority
            FROM Sales s
            JOIN Medicines m ON s.medicine_id = m.medicine_id
            LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id
            GROUP BY m.medicine_name
            HAVING total_sold > 100
            ORDER BY 
                CASE 
                    WHEN COALESCE(MAX(i.quantity_in_stock), 0) = 0 THEN 1
                    WHEN COALESCE(MAX(i.quantity_in_stock), 0) <= COALESCE(MAX(i.reorder_level), 10) THEN 2
                    WHEN COALESCE(MAX(i.quantity_in_stock), 0) <= COALESCE(MAX(i.reorder_level), 10) * 2 THEN 3
                    ELSE 4
                END,
                total_revenue DESC
            LIMIT 20
            """
            
            cursor.execute(week_plans_query)
            medicines_data = cursor.fetchall()
            
            # Transform data for frontend
            seasonal_performers_data = []
            for row in seasonal_performers:
                if season == 'all':
                    seasonal_performers_data.append({
                        'medicine': row[0],
                        'summer': int(row[1]),
                        'monsoon': int(row[2]),
                        'winter': int(row[3]),
                        'total': int(row[4])
                    })
                else:
                    seasonal_performers_data.append({
                        'medicine': row[0],
                        season: int(row[1]),
                        'total': int(row[2])
                    })
            
            fast_movers_data = []
            for i, row in enumerate(fast_movers):
                medicine_name, total_quantity, unique_orders, avg_daily_sales, total_revenue, current_stock, reorder_level = row
                
                # Calculate realistic urgency based on stock levels
                if current_stock == 0:
                    urgency = 'critical'
                elif current_stock <= reorder_level:
                    urgency = 'high'
                elif current_stock <= reorder_level * 2:
                    urgency = 'medium'
                else:
                    urgency = 'low'
                
                # Calculate days until out of stock
                if avg_daily_sales > 0:
                    # Cap daily sales at reasonable maximum to avoid unrealistic calculations
                    daily_sales_capped = min(avg_daily_sales, 50)  # Max 50 units per day
                    days_until_out = max(1, int(current_stock / daily_sales_capped))
                else:
                    days_until_out = 999  # No sales, won't run out
                
                # Cap days at reasonable maximum (1 year)
                days_until_out = min(days_until_out, 365)
                
                # Calculate suggested order quantity
                if urgency in ['critical', 'high']:
                    suggested_order = max(reorder_level * 2, int(total_quantity * 0.1))
                else:
                    suggested_order = max(reorder_level, int(total_quantity * 0.05))
                
                fast_movers_data.append({
                    'id': str(i + 1),
                    'medicine': medicine_name,
                    'currentStock': int(current_stock),
                    'demandRate': float(avg_daily_sales),
                    'daysUntilOut': days_until_out,
                    'urgency': urgency,
                    'suggestedOrder': suggested_order
                })
            
            top_medicines_data = []
            for i, row in enumerate(top_medicines):
                top_medicines_data.append({
                    'rank': i + 1,
                    'medicine_name': row[0],
                    'quantity_sold': int(row[1]),
                    'total_revenue': float(row[2]),
                    'unique_orders': int(row[3]),
                    'avg_price': float(row[4])
                })
            
            enhanced_medicines_data = []
            for i, row in enumerate(enhanced_medicines):
                medicine_name, category, total_quantity, total_revenue, unique_orders, avg_price, current_stock, reorder_level, purchase_price = row
                
                # Calculate priority based on stock levels and sales
                if current_stock == 0:
                    priority = 'critical'
                    stock_status = 'out'
                elif current_stock <= reorder_level:
                    priority = 'high'
                    stock_status = 'low'
                elif current_stock <= reorder_level * 2:
                    priority = 'medium'
                    stock_status = 'adequate'
                else:
                    priority = 'low'
                    stock_status = 'adequate'
                
                # Calculate suggested stock based on sales and current stock
                if total_quantity > 0:
                    suggested_stock = max(reorder_level * 2, int(total_quantity * 0.1))
                else:
                    suggested_stock = reorder_level * 2
                
                # Calculate estimated cost for restocking
                if purchase_price > 0:
                    estimated_cost = suggested_stock * purchase_price
                else:
                    estimated_cost = suggested_stock * (avg_price * 0.7)  # 70% of selling price
                
                enhanced_medicines_data.append({
                    'id': i + 1,
                    'name': medicine_name,
                    'category': category or 'General Medicine',
                    'priority': priority,
                    'suggestedStock': suggested_stock,
                    'estimatedCost': round(estimated_cost, 2),
                    'currentStock': int(current_stock),
                    'stockStatus': stock_status
                })
            
            # Group medicines by priority and create week plans
            week_plans_data = []
            critical_medicines = []
            high_medicines = []
            medium_medicines = []
            low_medicines = []
            
            for medicine_name, total_sold, total_revenue, current_stock, reorder_level, priority in medicines_data:
                medicine_info = {
                    'name': medicine_name,
                    'total_sold': total_sold,
                    'total_revenue': total_revenue,
                    'current_stock': current_stock,
                    'reorder_level': reorder_level,
                    'priority': priority
                }
                
                if priority == 'critical':
                    critical_medicines.append(medicine_info)
                elif priority == 'high':
                    high_medicines.append(medicine_info)
                elif priority == 'medium':
                    medium_medicines.append(medicine_info)
                else:
                    low_medicines.append(medicine_info)
            
            # Create week plans based on priority
            week_number = 1
            current_date = datetime.now()
            
            if critical_medicines:
                week_plans_data.append({
                    'week': f'Week {week_number} ({current_date.strftime("%b %d")} - {(current_date + timedelta(days=6)).strftime("%b %d")})',
                    'priority': 'critical',
                    'items': [med['name'] for med in critical_medicines[:5]],
                    'estimatedCost': sum(med['total_revenue'] * 0.1 for med in critical_medicines[:5]),
                    'status': 'pending'
                })
                week_number += 1
                current_date += timedelta(days=7)
            
            if high_medicines:
                week_plans_data.append({
                    'week': f'Week {week_number} ({current_date.strftime("%b %d")} - {(current_date + timedelta(days=6)).strftime("%b %d")})',
                    'priority': 'high',
                    'items': [med['name'] for med in high_medicines[:5]],
                    'estimatedCost': sum(med['total_revenue'] * 0.08 for med in high_medicines[:5]),
                    'status': 'pending'
                })
                week_number += 1
                current_date += timedelta(days=7)
            
            if medium_medicines:
                week_plans_data.append({
                    'week': f'Week {week_number} ({current_date.strftime("%b %d")} - {(current_date + timedelta(days=6)).strftime("%b %d")})',
                    'priority': 'medium',
                    'items': [med['name'] for med in medium_medicines[:5]],
                    'estimatedCost': sum(med['total_revenue'] * 0.06 for med in medium_medicines[:5]),
                    'status': 'pending'
                })
                week_number += 1
                current_date += timedelta(days=7)
            
            if low_medicines:
                week_plans_data.append({
                    'week': f'Week {week_number} ({current_date.strftime("%b %d")} - {(current_date + timedelta(days=6)).strftime("%b %d")})',
                    'priority': 'low',
                    'items': [med['name'] for med in low_medicines[:5]],
                    'estimatedCost': sum(med['total_revenue'] * 0.04 for med in low_medicines[:5]),
                    'status': 'pending'
                })
            
            return jsonify({
                'success': True,
                'data': {
                    'seasonal_performers': seasonal_performers_data,
                    'fast_movers': fast_movers_data,
                    'top_medicines': top_medicines_data,
                    'enhanced_medicines': enhanced_medicines_data,
                    'week_plans': week_plans_data
                },
                'season': season
            })
            
    except Exception as e:
        Logger.log_error(e, f"Seasonal data for {season}")
        return jsonify({
            'success': False,
            'error': f'Failed to get seasonal data for {season}',
            'message': str(e)
        }), 500


@analysis_bp.route('/fast-movers', methods=['GET'])
def get_fast_movers():
    """Get fast movers data for enhanced analytics."""
    try:
        df = analysis_engine.load_sales_data()
        fast_movers = analysis_engine.get_fast_movers(df)
        return jsonify({
            'success': True,
            'data': fast_movers
        })
        
    except Exception as e:
        Logger.log_error(e, "Fast movers analysis")
        return jsonify({
            'success': False,
            'error': 'Failed to get fast movers',
            'message': str(e)
        }), 500


@analysis_bp.route('/enhanced-medicines', methods=['GET'])
def get_enhanced_medicines():
    """Get enhanced medicines data for detailed recommendations."""
    try:
        df = analysis_engine.load_sales_data()
        medicines = analysis_engine.get_enhanced_medicines(df)
        return jsonify({
            'success': True,
            'data': medicines
        })
        
    except Exception as e:
        Logger.log_error(e, "Enhanced medicines analysis")
        return jsonify({
            'success': False,
            'error': 'Failed to get enhanced medicines',
            'message': str(e)
        }), 500


@analysis_bp.route('/week-plans', methods=['GET'])
def get_week_plans():
    """Get week-by-week ordering plans based on real database data."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get week plans based on real sales data and inventory levels
            week_plans_query = """
            SELECT 
                m.medicine_name,
                SUM(s.quantity_sold) as total_sold,
                SUM(s.total_amount) as total_revenue,
                COALESCE(MAX(i.quantity_in_stock), 0) as current_stock,
                COALESCE(MAX(i.reorder_level), 10) as reorder_level,
                CASE 
                    WHEN COALESCE(MAX(i.quantity_in_stock), 0) = 0 THEN 'critical'
                    WHEN COALESCE(MAX(i.quantity_in_stock), 0) <= COALESCE(MAX(i.reorder_level), 10) THEN 'high'
                    WHEN COALESCE(MAX(i.quantity_in_stock), 0) <= COALESCE(MAX(i.reorder_level), 10) * 2 THEN 'medium'
                    ELSE 'low'
                END as priority
            FROM Sales s
            JOIN Medicines m ON s.medicine_id = m.medicine_id
            LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id
            GROUP BY m.medicine_name
            HAVING total_sold > 100
            ORDER BY 
                CASE 
                    WHEN COALESCE(MAX(i.quantity_in_stock), 0) = 0 THEN 1
                    WHEN COALESCE(MAX(i.quantity_in_stock), 0) <= COALESCE(MAX(i.reorder_level), 10) THEN 2
                    WHEN COALESCE(MAX(i.quantity_in_stock), 0) <= COALESCE(MAX(i.reorder_level), 10) * 2 THEN 3
                    ELSE 4
                END,
                total_revenue DESC
            LIMIT 20
            """
            
            cursor.execute(week_plans_query)
            medicines_data = cursor.fetchall()
            
            # Group medicines by priority and create week plans
            week_plans = []
            critical_medicines = []
            high_medicines = []
            medium_medicines = []
            low_medicines = []
            
            for medicine_name, total_sold, total_revenue, current_stock, reorder_level, priority in medicines_data:
                medicine_info = {
                    'name': medicine_name,
                    'total_sold': total_sold,
                    'total_revenue': total_revenue,
                    'current_stock': current_stock,
                    'reorder_level': reorder_level,
                    'priority': priority
                }
                
                if priority == 'critical':
                    critical_medicines.append(medicine_info)
                elif priority == 'high':
                    high_medicines.append(medicine_info)
                elif priority == 'medium':
                    medium_medicines.append(medicine_info)
                else:
                    low_medicines.append(medicine_info)
            
            # Create week plans based on priority
            week_number = 1
            current_date = datetime.now()
            
            if critical_medicines:
                week_plans.append({
                    'week': f'Week {week_number} ({current_date.strftime("%b %d")} - {(current_date + timedelta(days=6)).strftime("%b %d")})',
                    'priority': 'critical',
                    'items': [med['name'] for med in critical_medicines[:5]],
                    'estimatedCost': sum(med['total_revenue'] * 0.1 for med in critical_medicines[:5]),
                    'status': 'pending'
                })
                week_number += 1
                current_date += timedelta(days=7)
            
            if high_medicines:
                week_plans.append({
                    'week': f'Week {week_number} ({current_date.strftime("%b %d")} - {(current_date + timedelta(days=6)).strftime("%b %d")})',
                    'priority': 'high',
                    'items': [med['name'] for med in high_medicines[:5]],
                    'estimatedCost': sum(med['total_revenue'] * 0.08 for med in high_medicines[:5]),
                    'status': 'pending'
                })
                week_number += 1
                current_date += timedelta(days=7)
            
            if medium_medicines:
                week_plans.append({
                    'week': f'Week {week_number} ({current_date.strftime("%b %d")} - {(current_date + timedelta(days=6)).strftime("%b %d")})',
                    'priority': 'medium',
                    'items': [med['name'] for med in medium_medicines[:5]],
                    'estimatedCost': sum(med['total_revenue'] * 0.06 for med in medium_medicines[:5]),
                    'status': 'pending'
                })
                week_number += 1
                current_date += timedelta(days=7)
            
            if low_medicines:
                week_plans.append({
                    'week': f'Week {week_number} ({current_date.strftime("%b %d")} - {(current_date + timedelta(days=6)).strftime("%b %d")})',
                    'priority': 'low',
                    'items': [med['name'] for med in low_medicines[:5]],
                    'estimatedCost': sum(med['total_revenue'] * 0.04 for med in low_medicines[:5]),
                    'status': 'pending'
                })
            
            return jsonify({
                'success': True,
                'data': week_plans
            })
            
    except Exception as e:
        Logger.log_error(e, "Week plans analysis")
        return jsonify({
            'success': False,
            'error': 'Failed to get week plans',
            'message': str(e)
        }), 500


@analysis_bp.route('/priority-distribution', methods=['GET'])
def get_priority_distribution():
    """Get priority distribution for dashboard based on real inventory data."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get priority distribution based on stock levels and sales performance
            cursor.execute("""
                WITH medicine_priorities AS (
                    SELECT 
                        m.medicine_id,
                        m.medicine_name,
                        CASE 
                            WHEN COALESCE(MAX(i.quantity_in_stock), 0) = 0 THEN 'critical'
                            WHEN COALESCE(MAX(i.quantity_in_stock), 0) <= COALESCE(MAX(i.reorder_level), 10) THEN 'high'
                            WHEN COALESCE(MAX(i.quantity_in_stock), 0) <= COALESCE(MAX(i.reorder_level), 10) * 2 THEN 'medium'
                            ELSE 'low'
                        END as priority,
                        COALESCE(SUM(s.total_amount), 0) as total_revenue
                    FROM Medicines m
                    LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id
                    LEFT JOIN Sales s ON m.medicine_id = s.medicine_id
                    GROUP BY m.medicine_id, m.medicine_name
                )
                SELECT 
                    priority,
                    COUNT(*) as count,
                    SUM(total_revenue) as total_revenue
                FROM medicine_priorities
                WHERE priority IS NOT NULL
                GROUP BY priority
                ORDER BY 
                    CASE priority 
                        WHEN 'critical' THEN 1 
                        WHEN 'high' THEN 2 
                        WHEN 'medium' THEN 3 
                        WHEN 'low' THEN 4 
                    END
            """)
            
            priority_data = cursor.fetchall()
            
            # Calculate total for percentages
            total_medicines = sum(row[1] for row in priority_data)
            total_revenue = sum(row[2] for row in priority_data)
            
            # Transform to distribution format
            distribution = []
            for priority, count, revenue in priority_data:
                percentage = round((count / total_medicines) * 100, 1) if total_medicines > 0 else 0
                revenue_percentage = round((revenue / total_revenue) * 100, 1) if total_revenue > 0 else 0
                
                distribution.append({
                    'priority': priority,
                    'count': count,
                    'percentage': percentage,
                    'revenue': revenue,
                    'revenue_percentage': revenue_percentage
                })
            
            return jsonify({
                'success': True,
                'data': {
                    'distribution': distribution,
                    'total_medicines': total_medicines,
                    'total_revenue': total_revenue
                }
            })
            
    except Exception as e:
        Logger.log_error(e, "Priority distribution analysis")
        return jsonify({
            'success': False,
            'error': 'Failed to get priority distribution',
            'message': str(e)
        }), 500


@analysis_bp.route('/immediate-actions', methods=['GET'])
def get_immediate_actions():
    """Get immediate actions based on current inventory status."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get critical and high priority medicines that need immediate attention
            cursor.execute("""
                SELECT 
                    m.medicine_name,
                    m.category,
                    COALESCE(MAX(i.quantity_in_stock), 0) as current_stock,
                    COALESCE(MAX(i.reorder_level), 10) as reorder_level,
                    COALESCE(AVG(i.purchase_price_per_unit), 0) as purchase_price,
                    CASE 
                        WHEN COALESCE(MAX(i.quantity_in_stock), 0) = 0 THEN 'critical'
                        WHEN COALESCE(MAX(i.quantity_in_stock), 0) <= COALESCE(MAX(i.reorder_level), 10) THEN 'high'
                        WHEN COALESCE(MAX(i.quantity_in_stock), 0) <= COALESCE(MAX(i.reorder_level), 10) * 2 THEN 'medium'
                        ELSE 'low'
                    END as priority,
                    COALESCE(SUM(s.quantity_sold), 0) as total_sold,
                    COALESCE(SUM(s.total_amount), 0) as total_revenue
                FROM Medicines m
                LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id
                LEFT JOIN Sales s ON m.medicine_id = s.medicine_id
                GROUP BY m.medicine_name, m.category
                HAVING priority IN ('critical', 'high')
                ORDER BY 
                    CASE priority 
                        WHEN 'critical' THEN 1 
                        WHEN 'high' THEN 2 
                        ELSE 3 
                    END,
                    total_revenue DESC
                LIMIT 10
            """)
            
            actions_data = cursor.fetchall()
            
            # Transform to immediate actions
            immediate_actions = []
            for i, row in enumerate(actions_data):
                medicine_name, category, current_stock, reorder_level, purchase_price, priority, total_sold, total_revenue = row
                
                if priority == 'critical':
                    title = f"Order {medicine_name}"
                    description = f"Out of stock - Order {reorder_level * 2} units immediately"
                    urgency = 'critical'
                else:  # high priority
                    title = f"Restock {medicine_name}"
                    description = f"Low stock ({current_stock} units) - Order {reorder_level} units"
                    urgency = 'high'
                
                immediate_actions.append({
                    'id': f'action_{i+1}',
                    'title': title,
                    'description': description,
                    'urgency': urgency,
                    'medicine_name': medicine_name,
                    'category': category,
                    'current_stock': current_stock,
                    'reorder_level': reorder_level,
                    'estimated_cost': round(reorder_level * purchase_price, 2),
                    'timestamp': datetime.now().isoformat()
                })
            
            return jsonify({
                'success': True,
                'data': immediate_actions
            })
            
    except Exception as e:
        Logger.log_error(e, "Immediate actions analysis")
        return jsonify({
            'success': False,
            'error': 'Failed to get immediate actions',
            'message': str(e)
        }), 500


@analysis_bp.route('/recent-activity', methods=['GET'])
def get_recent_activity():
    """Get recent activity for dashboard based on real database events."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get recent sales activity
            cursor.execute("""
                SELECT 
                    DATE(s.date_of_sale) as sale_date,
                    COUNT(DISTINCT s.invoice_id) as unique_orders,
                    COUNT(DISTINCT s.medicine_id) as unique_medicines,
                    SUM(s.quantity_sold) as total_quantity,
                    SUM(s.total_amount) as total_revenue
                FROM Sales s
                WHERE s.date_of_sale >= date('now', '-7 days')
                GROUP BY DATE(s.date_of_sale)
                ORDER BY sale_date DESC
                LIMIT 5
            """)
            
            sales_activity = cursor.fetchall()
            
            # Get inventory updates
            cursor.execute("""
                SELECT 
                    m.medicine_name,
                    i.updated_at,
                    i.quantity_in_stock,
                    i.reorder_level
                FROM Inventory i
                JOIN Medicines m ON i.medicine_id = m.medicine_id
                WHERE i.updated_at >= datetime('now', '-7 days')
                ORDER BY i.updated_at DESC
                LIMIT 5
            """)
            
            inventory_activity = cursor.fetchall()
            
            # Generate activity log
            activities = []
            
            # Add sales activities
            for i, (sale_date, orders, medicines, quantity, revenue) in enumerate(sales_activity):
                activities.append({
                    'id': f'sales_{i+1}',
                    'type': 'sales_update',
                    'message': f'{orders} orders, {medicines} medicines sold - ₹{revenue:,.0f} revenue',
                    'timestamp': sale_date,
                    'status': 'success'
                })
            
            # Add inventory activities
            for i, (medicine_name, updated_at, stock, reorder_level) in enumerate(inventory_activity):
                if stock <= reorder_level:
                    status = 'warning'
                    message = f'Low stock alert: {medicine_name} ({stock} units)'
                else:
                    status = 'info'
                    message = f'Stock updated: {medicine_name} ({stock} units)'
                
                activities.append({
                    'id': f'inventory_{i+1}',
                    'type': 'inventory_update',
                    'message': message,
                    'timestamp': updated_at,
                    'status': status
                })
            
            # Sort by timestamp (most recent first)
            activities.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return jsonify({
                'success': True,
                'data': activities[:10]  # Return top 10 most recent activities
            })
            
    except Exception as e:
        Logger.log_error(e, "Recent activity analysis")
        return jsonify({
            'success': False,
            'error': 'Failed to get recent activity',
            'message': str(e)
        }), 500


@analysis_bp.route('/sales-performance', methods=['GET'])
def get_sales_performance():
    """Get sales performance data for dashboard."""
    try:
        df = analysis_engine.load_sales_data()
        performance = analysis_engine.get_sales_performance(df)
        return jsonify({
            'success': True,
            'data': performance
        })
        
    except Exception as e:
        Logger.log_error(e, "Sales performance analysis")
        return jsonify({
            'success': False,
            'error': 'Failed to get sales performance',
            'message': str(e)
        }), 500


@analysis_bp.route('/daily-sales', methods=['GET'])
def get_daily_sales():
    """Get daily sales data for time series charts."""
    try:
        # Get period parameter (default to 30 days)
        period = request.args.get('period', '30', type=str)
        days = int(period) if period.isdigit() else 30
        
        # Use dynamic database state
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        # Create database manager with active database path
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # First, get the actual date range from the database
            cursor.execute("SELECT MIN(date_of_sale), MAX(date_of_sale) FROM Sales")
            date_range = cursor.fetchone()
            if not date_range or not date_range[0] or not date_range[1]:
                return jsonify({
                    'success': False,
                    'error': 'No sales data found in database'
                }), 404
            
            # Get the most recent data for the specified period
            query = """
            SELECT 
                DATE(date_of_sale) as sale_date,
                SUM(total_amount) as daily_revenue,
                SUM(quantity_sold) as daily_quantity,
                COUNT(DISTINCT invoice_id) as daily_transactions
            FROM Sales 
            WHERE date_of_sale >= date('{}', '-{} days')
            GROUP BY DATE(date_of_sale)
            ORDER BY sale_date
            """.format(date_range[1], days)
            
            cursor.execute(query)
            results = cursor.fetchall()
            
            # Convert to list of dictionaries
            daily_sales = []
            for row in results:
                daily_sales.append({
                    'date': row[0],
                    'revenue': float(row[1]) if row[1] else 0,
                    'quantity': int(row[2]) if row[2] else 0,
                    'transactions': int(row[3]) if row[3] else 0
                })
            
            # Fill in missing dates with zero values
            from datetime import datetime, timedelta
            # Always use today as the end date, even if database has older data
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=days-1)
            
            # Create a complete date range
            complete_data = []
            current_date = start_date
            sales_dict = {item['date']: item for item in daily_sales}
            
            while current_date <= end_date:
                date_str = current_date.strftime('%Y-%m-%d')
                if date_str in sales_dict:
                    complete_data.append(sales_dict[date_str])
                else:
                    complete_data.append({
                        'date': date_str,
                        'revenue': 0,
                        'quantity': 0,
                        'transactions': 0
                    })
                current_date += timedelta(days=1)
            
            return jsonify({
                'success': True,
                'data': complete_data,
                'period': period,
                'total_days': len(complete_data),
                'date_range': {
                    'start': start_date.strftime('%Y-%m-%d'),
                    'end': end_date.strftime('%Y-%m-%d')
                }
            })
            
    except Exception as e:
        Logger.log_error(e, "Daily sales data retrieval")
        return jsonify({
            'success': False,
            'error': 'Failed to get daily sales data',
            'message': str(e)
        }), 500


@analysis_bp.route('/kpi-metrics', methods=['GET'])
def get_kpi_metrics():
    """Get KPI metrics from real database data."""
    try:
        # Use dynamic database state
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        # Create database manager with active database path
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
                from datetime import datetime
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
            
            # Get top performing medicine
            cursor.execute("""
                SELECT medicine_id, SUM(total_amount) as revenue
                FROM Sales 
                GROUP BY medicine_id 
                ORDER BY revenue DESC 
                LIMIT 1
            """)
            top_medicine = cursor.fetchone()
            top_medicine_revenue = top_medicine[1] if top_medicine else 0
            
            return jsonify({
                'success': True,
                'data': {
                    'total_revenue': float(total_revenue),
                    'total_quantity': int(total_quantity),
                    'unique_medicines': int(unique_medicines),
                    'total_transactions': int(total_transactions),
                    'avg_daily_revenue': float(avg_daily_revenue),
                    'growth_rate': float(growth_rate),
                    'top_medicine_revenue': float(top_medicine_revenue),
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
        Logger.log_error(e, "KPI Metrics")
        return jsonify({
            'success': False,
            'error': 'Failed to get KPI metrics',
            'message': str(e)
        }), 500


@analysis_bp.route('/complete', methods=['GET'])
def get_complete_analysis():
    """Get complete analysis results."""
    try:
        results = analysis_engine.run_complete_analysis()
        
        if 'error' in results:
            return jsonify({
                'success': False,
                'error': results['error']
            }), 500
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        Logger.log_error(e, "Complete Analysis")
        return jsonify({
            'success': False,
            'error': 'Failed to run complete analysis',
            'message': str(e)
        }), 500


@analysis_bp.route('/detailed-seasonal-analysis/<season>', methods=['GET'])
def get_detailed_seasonal_analysis(season):
    """Get comprehensive seasonal analysis with timeline, requirements, and ordering recommendations."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get current date to determine season
            current_date = datetime.now()
            current_month = current_date.month
            
            # Determine season based on current date
            if current_month in [10, 11, 12, 1]:  # Oct, Nov, Dec, Jan
                current_season = 'winter'
            elif current_month in [2, 3, 4, 5]:  # Feb, Mar, Apr, May
                current_season = 'summer'
            elif current_month in [6, 7, 8, 9]:  # Jun, Jul, Aug, Sep
                current_season = 'monsoon'
            else:
                current_season = 'winter'
            
            # Use current season if 'all' is requested
            analysis_season = current_season if season == 'all' else season
            
            # Season timeline data (match seasonal data endpoint)
            season_timelines = {
                'winter': {
                    'duration': 'November to February',
                    'order_deadline': 'Late October',
                    'peak_period': 'December-January',
                    'months': [11, 12, 1, 2]
                },
                'summer': {
                    'duration': 'March to June',
                    'order_deadline': 'Late February',
                    'peak_period': 'April-May',
                    'months': [3, 4, 5, 6]
                },
                'monsoon': {
                    'duration': 'July to October',
                    'order_deadline': 'Late June',
                    'peak_period': 'August-September',
                    'months': [7, 8, 9, 10]
                }
            }
            
            timeline = season_timelines.get(analysis_season, season_timelines['winter'])
            
            # Get comprehensive seasonal data (match seasonal data query format)
            season_months = {
                'winter': "('10', '11', '12', '01')",
                'summer': "('02', '03', '04', '05')",
                'monsoon': "('06', '07', '08', '09')"
            }
            
            seasonal_query = f"""
            SELECT 
                m.medicine_name,
                m.category,
                COALESCE(SUM(s.quantity_sold), 0) as total_quantity,
                COALESCE(SUM(s.total_amount), 0) as total_revenue,
                COALESCE(COUNT(DISTINCT s.invoice_id), 0) as unique_orders,
                COALESCE(AVG(s.unit_price_at_sale), 0) as avg_price,
                COALESCE(MAX(i.quantity_in_stock), 0) as current_stock,
                COALESCE(MAX(i.reorder_level), 10) as reorder_level,
                COALESCE(AVG(i.purchase_price_per_unit), 0) as purchase_price,
                -- Calculate daily average sales for priority classification
                CASE 
                    WHEN COUNT(DISTINCT DATE(s.date_of_sale)) > 0 
                    THEN COALESCE(SUM(s.quantity_sold), 0) / COUNT(DISTINCT DATE(s.date_of_sale))
                    ELSE 0 
                END as daily_avg_sales
            FROM Medicines m
            LEFT JOIN Sales s ON m.medicine_id = s.medicine_id 
                AND strftime('%m', s.date_of_sale) IN {season_months[analysis_season]}
            LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id
            GROUP BY m.medicine_name, m.category
            ORDER BY total_quantity DESC
            """
            
            cursor.execute(seasonal_query)
            medicines_data = cursor.fetchall()
            
            # Get actual total medicines count from database (all medicines in inventory)
            cursor.execute("SELECT COUNT(DISTINCT m.medicine_id) FROM Medicines m LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id WHERE i.medicine_id IS NOT NULL")
            actual_total_medicines = cursor.fetchone()[0]
            
            # Calculate inventory requirements
            total_medicines = actual_total_medicines  # Use actual inventory count
            total_units = sum(row[2] for row in medicines_data)  # total_quantity from sales
            total_investment = sum(row[3] for row in medicines_data)  # total_revenue from sales
            daily_avg_sales = total_units / (len(medicines_data) * 120) if len(medicines_data) > 0 else 0  # Use sales data count for daily avg
            
            # Priority breakdown
            priority_breakdown = {
                'critical': {'count': 0, 'investment': 0, 'medicines': []},
                'high': {'count': 0, 'investment': 0, 'medicines': []},
                'medium': {'count': 0, 'investment': 0, 'medicines': []},
                'low': {'count': 0, 'investment': 0, 'medicines': []}
            }
            
            # Sort medicines by total revenue for priority classification
            sorted_medicines = sorted(medicines_data, key=lambda x: x[3], reverse=True)  # Sort by total_revenue
            
            for i, row in enumerate(sorted_medicines):
                medicine_name, category, total_quantity, total_revenue, unique_orders, avg_price, current_stock, reorder_level, purchase_price, daily_avg_sales = row
                
                # Calculate priority based on revenue ranking (like Engine.py)
                total_medicines = len(sorted_medicines)
                if i < int(total_medicines * 0.20):  # Top 20% = CRITICAL
                    priority = 'critical'
                elif i < int(total_medicines * 0.50):  # Next 30% = HIGH
                    priority = 'high'
                elif i < int(total_medicines * 0.80):  # Next 30% = MEDIUM
                    priority = 'medium'
                else:  # Bottom 20% = LOW
                    priority = 'low'
                
                # Calculate suggested order quantity (like Engine.py with 15% buffer)
                suggested_quantity = int(total_quantity * 1.15)  # 15% buffer like Engine.py
                
                if purchase_price > 0:
                    estimated_cost = suggested_quantity * purchase_price
                else:
                    estimated_cost = suggested_quantity * (avg_price * 0.7)
                
                medicine_info = {
                    'name': medicine_name,
                    'category': category,
                    'order_quantity': suggested_quantity,
                    'estimated_cost': estimated_cost,
                    'daily_need': round(daily_avg_sales, 1),
                    'priority': priority,
                    'current_stock': current_stock,
                    'reorder_level': reorder_level
                }
                
                priority_breakdown[priority]['count'] += 1
                priority_breakdown[priority]['investment'] += estimated_cost
                priority_breakdown[priority]['medicines'].append(medicine_info)
            
            # Get top 5 critical medicines (by original revenue, like Engine.py)
            # Use the same top 5 medicines as the seasonal data
            critical_medicines = []
            for i, row in enumerate(sorted_medicines[:5]):  # Top 5 by revenue
                medicine_name, category, total_quantity, total_revenue, unique_orders, avg_price, current_stock, reorder_level, purchase_price, daily_avg_sales = row
                
                # Calculate suggested order quantity (like Engine.py with 15% buffer)
                suggested_quantity = int(total_quantity * 1.15)  # 15% buffer like Engine.py
                
                if purchase_price > 0:
                    estimated_cost = suggested_quantity * purchase_price
                else:
                    estimated_cost = suggested_quantity * (avg_price * 0.7)
                
                critical_medicines.append({
                    'name': medicine_name,
                    'category': category,
                    'order_quantity': suggested_quantity,
                    'estimated_cost': estimated_cost,
                    'daily_need': round(daily_avg_sales, 1),
                    'priority': 'critical',
                    'current_stock': current_stock,
                    'reorder_level': reorder_level
                })
            
            # Create ordering calendar (like Engine.py)
            ordering_calendar = []
            
            # Week 1-2: Critical items (top 20% by revenue)
            critical_items = priority_breakdown['critical']['medicines'][:10]
            ordering_calendar.append({
                'period': 'Week 1-2 (Early Season)',
                'action': 'ORDER CRITICAL FAST-MOVERS',
                'medicines': len(critical_items),
                'quantity': sum(med['order_quantity'] for med in critical_items),
                'budget': sum(med['estimated_cost'] for med in critical_items)
            })
            
            # Week 3-4: High priority items (next 30% by revenue)
            high_items = priority_breakdown['high']['medicines'][:20]
            ordering_calendar.append({
                'period': 'Week 3-4 (Pre-Peak)',
                'action': 'ORDER HIGH PRIORITY ITEMS',
                'medicines': len(high_items),
                'quantity': sum(med['order_quantity'] for med in high_items),
                'budget': sum(med['estimated_cost'] for med in high_items)
            })
            
            # Week 5-8: Medium priority items (next 30% by revenue)
            medium_items = priority_breakdown['medium']['medicines'][:26]
            ordering_calendar.append({
                'period': 'Week 5-8 (Mid-Season)',
                'action': 'ORDER MEDIUM PRIORITY ITEMS',
                'medicines': len(medium_items),
                'quantity': sum(med['order_quantity'] for med in medium_items),
                'budget': sum(med['estimated_cost'] for med in medium_items)
            })
            
            # Week 9-12: Restock critical items (50% of critical)
            restock_items = [med for med in critical_items]  # Same as critical for restocking
            ordering_calendar.append({
                'period': 'Week 9-12 (Peak Season)',
                'action': 'RESTOCK FAST-MOVING ITEMS',
                'medicines': len(restock_items),
                'quantity': sum(med['order_quantity'] for med in restock_items),
                'budget': sum(med['estimated_cost'] for med in restock_items)
            })
            
            # Critical actions
            critical_actions = [
                f"⚠️ URGENT: Order {priority_breakdown['critical']['count']} critical medicines before {timeline['order_deadline']}",
                f"📦 Prepare storage space for ~{total_units:,} units",
                f"💰 Allocate budget: ₹{total_investment:,.2f} for complete stock",
                f"🔄 Set up supplier coordination for {len([med for med in priority_breakdown['critical']['medicines'] if med['daily_need'] > 2])} fast-moving items",
                f"📊 Monitor stock levels daily during {timeline['peak_period']} peak period"
            ]
            
            return jsonify({
                'success': True,
                'data': {
                    'season': analysis_season.upper(),
                    'timeline': timeline,
                    'inventory_requirements': {
                        'total_medicines': total_medicines,
                        'total_units': total_units,
                        'estimated_investment': total_investment,
                        'daily_avg_sales': round(daily_avg_sales, 1)
                    },
                    'priority_breakdown': {
                        'critical': {
                            'count': priority_breakdown['critical']['count'],
                            'investment': priority_breakdown['critical']['investment'],
                            'percentage': round((priority_breakdown['critical']['investment'] / total_investment) * 100, 1) if total_investment > 0 else 0,
                            'medicines': priority_breakdown['critical']['medicines']
                        },
                        'high': {
                            'count': priority_breakdown['high']['count'],
                            'investment': priority_breakdown['high']['investment'],
                            'percentage': round((priority_breakdown['high']['investment'] / total_investment) * 100, 1) if total_investment > 0 else 0,
                            'medicines': priority_breakdown['high']['medicines']
                        },
                        'medium': {
                            'count': priority_breakdown['medium']['count'],
                            'investment': priority_breakdown['medium']['investment'],
                            'percentage': round((priority_breakdown['medium']['investment'] / total_investment) * 100, 1) if total_investment > 0 else 0,
                            'medicines': priority_breakdown['medium']['medicines']
                        },
                        'low': {
                            'count': priority_breakdown['low']['count'],
                            'investment': priority_breakdown['low']['investment'],
                            'percentage': round((priority_breakdown['low']['investment'] / total_investment) * 100, 1) if total_investment > 0 else 0,
                            'medicines': priority_breakdown['low']['medicines']
                        }
                    },
                    'critical_actions': critical_actions,
                    'top_5_medicines': critical_medicines,
                    'ordering_calendar': ordering_calendar,
                    'current_season': current_season
                }
            })
            
    except Exception as e:
        Logger.log_error(e, f"Detailed seasonal analysis for {season}")
        return jsonify({
            'success': False,
            'error': f'Failed to get detailed seasonal analysis for {season}',
            'message': str(e)
        }), 500


@analysis_bp.route('/advanced-analytics', methods=['GET'])
def get_advanced_analytics():
    """Get advanced analytics with time-series forecasting for top N medicines."""
    try:
        # Get and validate top_n parameter
        top_n = request.args.get('top_n', 3, type=int)
        top_n = max(min(top_n, 10), 3)  # Ensure between 3 and 10
        
        # Use dynamic database state
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get top N medicines by total sales
            top_medicines_query = """
            SELECT 
                m.medicine_id,
                m.medicine_name,
                SUM(s.quantity_sold) as total_quantity
            FROM Sales s
            JOIN Medicines m ON s.medicine_id = m.medicine_id
            GROUP BY m.medicine_id, m.medicine_name
            ORDER BY total_quantity DESC
            LIMIT ?
            """
            
            cursor.execute(top_medicines_query, (top_n,))
            top_medicines = cursor.fetchall()
            
            if not top_medicines:
                return jsonify({
                    'success': False,
                    'error': 'No medicines found in database'
                }), 404
            
            # Process each medicine
            medicines_data = []
            
            for medicine_id, medicine_name, total_quantity in top_medicines:
                # Get complete sales history for this medicine
                sales_history_query = """
                SELECT 
                    DATE(s.date_of_sale) as sale_date,
                    s.quantity_sold
                FROM Sales s
                WHERE s.medicine_id = ?
                ORDER BY s.date_of_sale
                """
                
                cursor.execute(sales_history_query, (medicine_id,))
                sales_data = cursor.fetchall()
                
                # Process forecasts for this medicine
                medicine_forecasts = forecasting_engine.process_medicine_forecasts(
                    medicine_id, medicine_name, sales_data
                )
                
                medicines_data.append(medicine_forecasts)
            
            return jsonify({
                'success': True,
                'top_n': top_n,
                'medicines': medicines_data
            })
            
    except Exception as e:
        Logger.log_error(e, "Advanced Analytics")
        return jsonify({
            'success': False,
            'error': 'Failed to get advanced analytics',
            'message': str(e)
        }), 500
