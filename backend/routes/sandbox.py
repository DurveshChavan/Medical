"""
Sandbox mode routes for the Seasonal Medicine Recommendation System.
Handles sandbox mode operations for testing and temporary data analysis.
"""

import logging
from datetime import datetime
from typing import Dict, Any
from flask import Blueprint, request, jsonify

from config import INPUT_DIR
from utils.utils import Logger

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
sandbox_bp = Blueprint('sandbox', __name__, url_prefix='/api')


@sandbox_bp.route('/sandbox/status', methods=['GET'])
def get_sandbox_status():
    """
    Get current sandbox mode status.
    
    Returns:
        Dict[str, Any]: Sandbox status
    """
    try:
        from models.database_state import db_state
        status = db_state.get_database_status()
        
        return jsonify({
            'success': True,
            'sandbox_status': status
        })
        
    except Exception as e:
        logger.error(f"Failed to get sandbox status: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get sandbox status',
            'message': str(e)
        }), 500


@sandbox_bp.route('/sandbox/analyze', methods=['POST'])
def analyze_uploaded_data():
    """
    Analyze uploaded CSV data in sandbox mode.
    
    Expected JSON payload:
    {
        "csv_filename": "filename.csv"
    }
    
    Returns:
        Dict[str, Any]: Analysis results
    """
    try:
        data = request.get_json()
        if not data or 'csv_filename' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing csv_filename parameter'
            }), 400
        
        csv_filename = data['csv_filename']
        csv_file_path = INPUT_DIR / csv_filename
        
        if not csv_file_path.exists():
            return jsonify({
                'success': False,
                'error': 'CSV file not found',
                'message': f'File {csv_filename} does not exist'
            }), 404
        
        # Import database state manager
        from models.database_state import db_state
        
        # Switch to temporary database with uploaded CSV
        if not db_state.switch_to_temp_database(str(csv_file_path)):
            return jsonify({
                'success': False,
                'error': 'Failed to switch to temporary database'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Data analyzed successfully in temporary mode',
            'sandbox_status': db_state.get_database_status()
        })
        
    except Exception as e:
        logger.error(f"Failed to analyze uploaded data: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to analyze uploaded data',
            'message': str(e)
        }), 500


@sandbox_bp.route('/sandbox/reset', methods=['POST'])
def reset_sandbox():
    """
    Reset sandbox mode and restore main database.
    
    Returns:
        Dict[str, Any]: Reset results
    """
    try:
        from models.database_state import db_state
        
        # Switch back to main database
        if not db_state.switch_to_main_database():
            return jsonify({
                'success': False,
                'error': 'Failed to switch to main database'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Database reset successfully to main database',
            'sandbox_status': db_state.get_database_status()
        })
        
    except Exception as e:
        logger.error(f"Failed to reset sandbox: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to reset sandbox',
            'message': str(e)
        }), 500
