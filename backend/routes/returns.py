"""
Returns Routes - Medicine returns and refunds
"""
from flask import Blueprint, request, jsonify
from services.returns_service import returns_service
import logging

logger = logging.getLogger(__name__)

# Create blueprint
returns_bp = Blueprint('returns', __name__)

@returns_bp.route('/api/returns/invoices/search', methods=['GET'])
def search_invoices():
    """Search invoices for return processing"""
    try:
        query = request.args.get('query', '')
        if not query:
            return jsonify({
                'success': False,
                'error': 'Query parameter is required'
            }), 400
        
        invoices = returns_service.search_invoices_for_return(query)
        
        return jsonify({
            'success': True,
            'data': invoices
        })
        
    except Exception as e:
        logger.error(f"Error searching invoices: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to search invoices'
        }), 500

@returns_bp.route('/api/returns/invoices/<int:invoice_id>', methods=['GET'])
def get_invoice_for_return(invoice_id):
    """Get invoice details for return processing"""
    try:
        invoice_details = returns_service.get_invoice_for_return(invoice_id)
        
        if not invoice_details:
            return jsonify({
                'success': False,
                'error': 'Invoice not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': invoice_details
        })
        
    except Exception as e:
        logger.error(f"Error getting invoice for return: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get invoice details'
        }), 500

@returns_bp.route('/api/returns/create', methods=['POST'])
def create_return():
    """Create medicine return"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request data is required'
            }), 400
        
        # Validate required fields
        required_fields = ['sale_id', 'customer_id', 'medicine_id', 'quantity_returned']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400
        
        # Create return
        success, return_id, message = returns_service.create_return(data)
        
        if success:
            return jsonify({
                'success': True,
                'data': {
                    'return_id': return_id,
                    'message': message
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
    except Exception as e:
        logger.error(f"Error creating return: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to create return'
        }), 500

@returns_bp.route('/api/returns/<int:return_id>/refund', methods=['POST'])
def process_refund(return_id):
    """Process refund for a return"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request data is required'
            }), 400
        
        # Add return_id to data
        data['return_id'] = return_id
        
        # Validate required fields
        required_fields = ['customer_id', 'refund_amount']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400
        
        # Process refund
        success, refund_id, message = returns_service.process_refund(data)
        
        if success:
            return jsonify({
                'success': True,
                'data': {
                    'refund_id': refund_id,
                    'message': message
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
    except Exception as e:
        logger.error(f"Error processing refund: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to process refund'
        }), 500

@returns_bp.route('/api/returns/history', methods=['GET'])
def get_return_history():
    """Get return history with pagination"""
    try:
        customer_id = request.args.get('customer_id', type=int)
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Limit to reasonable values
        limit = min(limit, 1000)  # Max 1000 returns per request
        offset = max(offset, 0)   # No negative offset
        
        returns = returns_service.get_return_history(customer_id, limit=limit, offset=offset)
        
        return jsonify({
            'success': True,
            'data': returns,
            'pagination': {
                'limit': limit,
                'offset': offset,
                'count': len(returns)
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting return history: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get return history'
        }), 500

@returns_bp.route('/api/returns/refunds/history', methods=['GET'])
def get_refund_history():
    """Get refund history"""
    try:
        customer_id = request.args.get('customer_id', type=int)
        
        refunds = returns_service.get_refund_history(customer_id)
        
        return jsonify({
            'success': True,
            'data': refunds
        })
        
    except Exception as e:
        logger.error(f"Error getting refund history: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get refund history'
        }), 500