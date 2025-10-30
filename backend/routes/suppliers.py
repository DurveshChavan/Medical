"""
Suppliers API Routes
===================
Handles all supplier-related API endpoints.
"""

from flask import Blueprint, request, jsonify
import logging
from services.supplier_service import supplier_service

logger = logging.getLogger(__name__)

# Create blueprint
suppliers_bp = Blueprint('suppliers', __name__, url_prefix='/api/suppliers')


@suppliers_bp.route('/', methods=['GET'])
def get_all_suppliers():
    """Get all suppliers with pagination."""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        result = supplier_service.get_all_suppliers(page, limit, active_only)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in get_all_suppliers: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@suppliers_bp.route('/search', methods=['GET'])
def search_suppliers():
    """Search suppliers by query."""
    try:
        query = request.args.get('query', '')
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        if not query:
            return jsonify({
                'success': False,
                'error': 'Query parameter is required'
            }), 400
        
        result = supplier_service.search_suppliers(query, active_only)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in search_suppliers: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@suppliers_bp.route('/<int:supplier_id>', methods=['GET'])
def get_supplier_by_id(supplier_id):
    """Get supplier by ID."""
    try:
        result = supplier_service.get_supplier_by_id(supplier_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_supplier_by_id: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@suppliers_bp.route('/', methods=['POST'])
def create_supplier():
    """Create a new supplier."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        result = supplier_service.create_supplier(data)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in create_supplier: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@suppliers_bp.route('/<int:supplier_id>', methods=['PUT'])
def update_supplier(supplier_id):
    """Update supplier information."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        result = supplier_service.update_supplier(supplier_id, data)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in update_supplier: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@suppliers_bp.route('/<int:supplier_id>', methods=['DELETE'])
def delete_supplier(supplier_id):
    """Deactivate supplier (soft delete)."""
    try:
        result = supplier_service.deactivate_supplier(supplier_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in delete_supplier: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@suppliers_bp.route('/<int:supplier_id>/statistics', methods=['GET'])
def get_supplier_statistics(supplier_id):
    """Get supplier statistics."""
    try:
        result = supplier_service.get_supplier_statistics(supplier_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_supplier_statistics: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@suppliers_bp.route('/<int:supplier_id>/purchase_history', methods=['GET'])
def get_supplier_purchase_history(supplier_id):
    """Get supplier purchase history."""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        
        result = supplier_service.get_supplier_purchase_history(supplier_id, page, limit)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_supplier_purchase_history: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@suppliers_bp.route('/<int:supplier_id>/medicines', methods=['GET'])
def get_supplier_medicines(supplier_id):
    """Get medicines supplied by this supplier."""
    try:
        result = supplier_service.get_supplier_medicines(supplier_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_supplier_medicines: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@suppliers_bp.route('/<int:supplier_id>/pending_orders', methods=['GET'])
def get_supplier_pending_orders(supplier_id):
    """Get pending orders for this supplier."""
    try:
        result = supplier_service.get_supplier_pending_orders(supplier_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_supplier_pending_orders: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500