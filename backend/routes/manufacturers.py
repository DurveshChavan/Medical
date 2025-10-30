"""
Manufacturers API Routes
========================
Handles all manufacturer-related API endpoints.
"""

from flask import Blueprint, request, jsonify
import logging
from services.manufacturer_service import manufacturer_service

logger = logging.getLogger(__name__)

# Create blueprint
manufacturers_bp = Blueprint('manufacturers', __name__, url_prefix='/api/manufacturers')


@manufacturers_bp.route('/', methods=['GET'])
def get_all_manufacturers():
    """Get all manufacturers with pagination."""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        result = manufacturer_service.get_all_manufacturers(page, limit, active_only)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in get_all_manufacturers: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@manufacturers_bp.route('/search', methods=['GET'])
def search_manufacturers():
    """Search manufacturers by query."""
    try:
        query = request.args.get('query', '')
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        if not query:
            return jsonify({
                'success': False,
                'error': 'Query parameter is required'
            }), 400
        
        result = manufacturer_service.search_manufacturers(query, active_only)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in search_manufacturers: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@manufacturers_bp.route('/<int:manufacturer_id>', methods=['GET'])
def get_manufacturer_by_id(manufacturer_id):
    """Get manufacturer by ID."""
    try:
        result = manufacturer_service.get_manufacturer_by_id(manufacturer_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_manufacturer_by_id: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@manufacturers_bp.route('/', methods=['POST'])
def create_manufacturer():
    """Create a new manufacturer."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        result = manufacturer_service.create_manufacturer(data)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in create_manufacturer: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@manufacturers_bp.route('/<int:manufacturer_id>', methods=['PUT'])
def update_manufacturer(manufacturer_id):
    """Update manufacturer information."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        result = manufacturer_service.update_manufacturer(manufacturer_id, data)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in update_manufacturer: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@manufacturers_bp.route('/<int:manufacturer_id>', methods=['DELETE'])
def delete_manufacturer(manufacturer_id):
    """Deactivate manufacturer (soft delete)."""
    try:
        result = manufacturer_service.deactivate_manufacturer(manufacturer_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in delete_manufacturer: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@manufacturers_bp.route('/<int:manufacturer_id>/statistics', methods=['GET'])
def get_manufacturer_statistics(manufacturer_id):
    """Get manufacturer statistics."""
    try:
        result = manufacturer_service.get_manufacturer_statistics(manufacturer_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_manufacturer_statistics: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@manufacturers_bp.route('/<int:manufacturer_id>/medicines', methods=['GET'])
def get_manufacturer_medicines(manufacturer_id):
    """Get medicines manufactured by this manufacturer."""
    try:
        result = manufacturer_service.get_manufacturer_medicines(manufacturer_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_manufacturer_medicines: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@manufacturers_bp.route('/<int:manufacturer_id>/inventory', methods=['GET'])
def get_manufacturer_inventory(manufacturer_id):
    """Get inventory levels for manufacturer's medicines."""
    try:
        result = manufacturer_service.get_manufacturer_inventory(manufacturer_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_manufacturer_inventory: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500