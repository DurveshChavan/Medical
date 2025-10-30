"""
Purchase Orders API Routes
==========================
Handles all purchase order-related API endpoints.
"""

from flask import Blueprint, request, jsonify
import logging
from services.purchase_order_service import purchase_order_service

logger = logging.getLogger(__name__)

# Create blueprint
purchase_orders_bp = Blueprint('purchase_orders', __name__, url_prefix='/api/purchase_orders')


@purchase_orders_bp.route('/create', methods=['POST'])
def create_purchase_order():
    """Create a new purchase order."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        # Validate required fields
        required_fields = ['supplier_id', 'items', 'total_amount']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        result = purchase_order_service.create_purchase_order(
            data['supplier_id'],
            data['items'],
            data['total_amount']
        )
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in create_purchase_order: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@purchase_orders_bp.route('/pending', methods=['GET'])
def get_pending_orders():
    """Get all pending purchase orders."""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        
        result = purchase_order_service.get_pending_orders(page, limit)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in get_pending_orders: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@purchase_orders_bp.route('/<int:purchase_invoice_id>/finalize', methods=['PUT'])
def finalize_purchase_order(purchase_invoice_id):
    """Finalize a purchase order."""
    try:
        result = purchase_order_service.finalize_purchase_order(purchase_invoice_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in finalize_purchase_order: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@purchase_orders_bp.route('/<int:purchase_invoice_id>', methods=['GET'])
def get_purchase_order_details(purchase_invoice_id):
    """Get purchase order details."""
    try:
        result = purchase_order_service.get_purchase_order_details(purchase_invoice_id)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_purchase_order_details: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@purchase_orders_bp.route('/supplier/<int:supplier_id>', methods=['GET'])
def get_supplier_purchase_orders(supplier_id):
    """Get purchase orders for a specific supplier."""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        
        result = purchase_order_service.get_supplier_purchase_orders(supplier_id, page, limit)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_supplier_purchase_orders: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500