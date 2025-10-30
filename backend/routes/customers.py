"""
Customer Routes - Customer management and credit payments
"""
from flask import Blueprint, request, jsonify
from services.customer_service import customer_service
import logging

logger = logging.getLogger(__name__)

# Create blueprint
customers_bp = Blueprint('customers', __name__)

@customers_bp.route('/api/customers/search', methods=['GET'])
def search_customers():
    """Search customers"""
    try:
        query = request.args.get('query', '')
        limit = request.args.get('limit', 20, type=int)
        
        # Limit to reasonable values
        limit = min(limit, 100)  # Max 100 customers per search
        
        customers = customer_service.search_customers(query, limit=limit)
        
        return jsonify({
            'success': True,
            'data': customers
        })
        
    except Exception as e:
        logger.error(f"Error searching customers: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to search customers'
        }), 500

@customers_bp.route('/api/customers', methods=['GET'])
def get_all_customers():
    """Get all customers with pagination"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Limit to reasonable values
        limit = min(limit, 1000)  # Max 1000 customers per request
        offset = max(offset, 0)   # No negative offset
        
        customers = customer_service.get_all_customers(limit=limit, offset=offset)
        
        return jsonify({
            'success': True,
            'data': customers,
            'pagination': {
                'limit': limit,
                'offset': offset,
                'count': len(customers)
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting customers: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get customers'
        }), 500

@customers_bp.route('/api/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    """Get customer by ID"""
    try:
        customer = customer_service.get_customer_by_id(customer_id)
        
        if not customer:
            return jsonify({
                'success': False,
                'error': 'Customer not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': customer
        })
        
    except Exception as e:
        logger.error(f"Error getting customer: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get customer'
        }), 500

@customers_bp.route('/api/customers', methods=['POST'])
def create_customer():
    """Create new customer"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request data is required'
            }), 400
        
        # Validate required fields
        required_fields = ['name', 'phone', 'address']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400
        
        success, customer_id, message = customer_service.create_customer(data)
        
        if success:
            return jsonify({
                'success': True,
                'data': {
                    'customer_id': customer_id,
                    'message': message
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
    except Exception as e:
        logger.error(f"Error creating customer: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to create customer'
        }), 500

@customers_bp.route('/api/customers/<int:customer_id>', methods=['PUT'])
def update_customer(customer_id):
    """Update customer"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request data is required'
            }), 400
        
        success, message = customer_service.update_customer(customer_id, data)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
    except Exception as e:
        logger.error(f"Error updating customer: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to update customer'
        }), 500

@customers_bp.route('/api/customers/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    """Delete customer"""
    try:
        success, message = customer_service.delete_customer(customer_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
    except Exception as e:
        logger.error(f"Error deleting customer: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete customer'
        }), 500

@customers_bp.route('/api/customers/<int:customer_id>/statistics', methods=['GET'])
def get_customer_statistics(customer_id):
    """Get customer statistics"""
    try:
        stats = customer_service.get_customer_statistics(customer_id)
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        logger.error(f"Error getting customer statistics: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get customer statistics'
        }), 500

@customers_bp.route('/api/customers/<int:customer_id>/pay_credit', methods=['POST'])
def pay_credit(customer_id):
    """Process credit payment"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request data is required'
            }), 400
        
        # Validate required fields
        required_fields = ['amount', 'payment_method']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400
        
        success, message = customer_service.pay_credit(customer_id, data)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
    except Exception as e:
        logger.error(f"Error processing credit payment: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to process credit payment'
        }), 500

@customers_bp.route('/api/customers/<int:customer_id>/purchases', methods=['GET'])
def get_customer_purchases(customer_id):
    """Get customer purchase history"""
    try:
        purchases = customer_service.get_purchase_history(customer_id)
        
        return jsonify({
            'success': True,
            'data': purchases
        })
        
    except Exception as e:
        logger.error(f"Error getting customer purchases: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get customer purchases'
        }), 500

@customers_bp.route('/api/customers/<int:customer_id>/credit_summary', methods=['GET'])
def get_credit_summary(customer_id):
    """Get customer credit summary"""
    try:
        summary = customer_service.get_credit_summary(customer_id)
        
        return jsonify({
            'success': True,
            'data': summary
        })
        
    except Exception as e:
        logger.error(f"Error getting credit summary: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get credit summary'
        }), 500