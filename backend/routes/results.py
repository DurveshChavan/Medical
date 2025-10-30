"""
Results and status routes for the Seasonal Medicine Recommendation System.
Handles analysis results retrieval, status checking, and data management.
"""

import logging
from datetime import datetime
from typing import Dict, Any
from flask import Blueprint, jsonify

from models.database import get_database_status, get_database_manager
from utils.data_loader import get_data_loading_status
from utils.utils import Logger

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
results_bp = Blueprint('results', __name__, url_prefix='/api')

# Global variables for analysis status
analysis_status = {
    'is_running': False,
    'progress': 0,
    'current_step': '',
    'results': None,
    'error': None,
    'started_at': None,
    'completed_at': None
}


@results_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint.
    
    Returns:
        Dict[str, Any]: System health status
    """
    try:
        db_status = get_database_status()
        loading_status = get_data_loading_status()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'database': {
                'connected': db_status.get('connection_test', False),
                'exists': db_status.get('exists', False),
                'size_mb': db_status.get('file_size_mb', 0)
            },
            'data': {
                'sales_records': loading_status.get('sales_records', 0),
                'unique_medicines': loading_status.get('unique_medicines', 0)
            },
            'analysis': {
                'is_running': analysis_status['is_running'],
                'last_completed': analysis_status['completed_at']
            }
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@results_bp.route('/analysis/status', methods=['GET'])
def get_analysis_status():
    """
    Get current analysis status.
    
    Returns:
        Dict[str, Any]: Analysis status
    """
    return jsonify({
        'is_running': analysis_status['is_running'],
        'progress': analysis_status['progress'],
        'current_step': analysis_status['current_step'],
        'error': analysis_status['error'],
        'started_at': analysis_status['started_at'],
        'completed_at': analysis_status['completed_at']
    })


@results_bp.route('/analysis/results', methods=['GET'])
def get_analysis_results():
    """
    Get latest analysis results.
    
    Returns:
        Dict[str, Any]: Analysis results
    """
    if analysis_status['results'] is None:
        return jsonify({
            'success': False,
            'error': 'No analysis results available',
            'message': 'Please run an analysis first'
        }), 404
    
    return jsonify({
        'success': True,
        'results': analysis_status['results'],
        'completed_at': analysis_status['completed_at']
    })


@results_bp.route('/recommendations/<season>', methods=['GET'])
def get_seasonal_recommendations(season: str):
    """
    Get seasonal recommendations for a specific season.
    
    Args:
        season (str): Season name (Summer, Monsoon, Winter)
        
    Returns:
        Dict[str, Any]: Seasonal recommendations
    """
    try:
        valid_seasons = ['Summer', 'Monsoon', 'Winter']
        if season not in valid_seasons:
            return jsonify({
                'success': False,
                'error': 'Invalid season',
                'message': f'Season must be one of: {valid_seasons}'
            }), 400
        
        # Check if we have results for this season
        if analysis_status['results'] is None:
            return jsonify({
                'success': False,
                'error': 'No analysis results available',
                'message': 'Please run an analysis first'
            }), 404
        
        results = analysis_status['results']
        if 'recommendations' not in results:
            return jsonify({
                'success': False,
                'error': 'No recommendations available',
                'message': 'Recommendations not found in analysis results'
            }), 404
        
        return jsonify({
            'success': True,
            'season': season,
            'recommendations': results['recommendations'],
            'generated_at': analysis_status['completed_at']
        })
        
    except Exception as e:
        Logger.log_error(e, f"Get Recommendations for {season}")
        return jsonify({
            'success': False,
            'error': 'Failed to get recommendations',
            'message': str(e)
        }), 500


@results_bp.route('/visualizations/<viz_type>', methods=['GET'])
def get_visualization(viz_type: str):
    """
    Get visualization files.
    
    Args:
        viz_type (str): Visualization type (seasonal_overview, etc.)
        
    Returns:
        Dict[str, Any]: Visualization info
    """
    try:
        from config import OUTPUT_DIR, OUTPUT_PATTERNS
        
        if viz_type == 'seasonal_overview':
            file_path = OUTPUT_DIR / OUTPUT_PATTERNS['seasonal_overview']
        else:
            return jsonify({
                'success': False,
                'error': 'Unknown visualization type',
                'message': f'Visualization type {viz_type} not supported'
            }), 400
        
        if not file_path.exists():
            return jsonify({
                'success': False,
                'error': 'Visualization not found',
                'message': f'Visualization file {file_path.name} not found'
            }), 404
        
        return jsonify({
            'success': True,
            'visualization_type': viz_type,
            'file_path': str(file_path),
            'file_name': file_path.name,
            'file_size_bytes': file_path.stat().st_size
        })
        
    except Exception as e:
        Logger.log_error(e, f"Get Visualization {viz_type}")
        return jsonify({
            'success': False,
            'error': 'Failed to get visualization',
            'message': str(e)
        }), 500


@results_bp.route('/data/status', methods=['GET'])
def get_data_status():
    """
    Get data loading and database status.
    
    Returns:
        Dict[str, Any]: Data status
    """
    try:
        db_status = get_database_status()
        loading_status = get_data_loading_status()
        
        return jsonify({
            'success': True,
            'database': db_status,
            'data_loading': loading_status,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        Logger.log_error(e, "Data Status")
        return jsonify({
            'success': False,
            'error': 'Failed to get data status',
            'message': str(e)
        }), 500


