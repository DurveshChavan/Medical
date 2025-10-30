"""
Billing Routes - POS billing operations
"""
from flask import Blueprint, request, jsonify, render_template_string
from services.billing_service import billing_service
from services.print_service import print_service
import logging

logger = logging.getLogger(__name__)

# Create blueprint
billing_bp = Blueprint('billing', __name__)

@billing_bp.route('/api/billing/medicines/search', methods=['GET'])
def search_medicines():
    """Search medicines for billing"""
    try:
        query = request.args.get('query', '')
        if not query:
            return jsonify({
                'success': False,
                'error': 'Query parameter is required'
            }), 400
        
        medicines = billing_service.search_medicines(query)
        
        return jsonify({
            'success': True,
            'data': medicines
        })
        
    except Exception as e:
        logger.error(f"Error searching medicines: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to search medicines'
        }), 500

@billing_bp.route('/api/billing/medicines/<int:medicine_id>/stock', methods=['GET'])
def get_medicine_stock(medicine_id):
    """Get medicine stock information"""
    try:
        stock_info = billing_service.get_medicine_stock(medicine_id)
        
        if not stock_info:
            return jsonify({
                'success': False,
                'error': 'Medicine not found or out of stock'
            }), 404
        
        return jsonify({
            'success': True,
            'data': stock_info
        })
        
    except Exception as e:
        logger.error(f"Error getting medicine stock: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get medicine stock'
        }), 500

@billing_bp.route('/api/billing/invoices/create', methods=['POST'])
def create_invoice():
    """Create new invoice"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request data is required'
            }), 400
        
        # Validate required fields
        required_fields = ['cart_items']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400
        
        # Validate totals if provided
        if 'totals' in data:
            cart_items = data['cart_items']
            client_subtotal = sum(item['total_amount'] for item in cart_items)
            client_gst = client_subtotal * 0.18
            client_total = client_subtotal + client_gst
            
            server_totals = {
                'subtotal': client_subtotal,
                'gst_amount': client_gst,
                'total': client_total
            }
            
            # Compare with client totals
            if abs(data['totals']['subtotal'] - server_totals['subtotal']) > 0.01:
                return jsonify({
                    'success': False,
                    'error': 'Subtotal mismatch between client and server calculations'
                }), 400
            
            if abs(data['totals']['total'] - server_totals['total']) > 0.01:
                return jsonify({
                    'success': False,
                    'error': 'Total amount mismatch between client and server calculations'
                }), 400
        
        # Create invoice
        success, invoice_id, message = billing_service.create_invoice(data)
        
        if success:
            return jsonify({
                'success': True,
                'data': {
                    'invoice_id': invoice_id,
                    'message': message
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
    except Exception as e:
        logger.error(f"Error creating invoice: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to create invoice'
        }), 500

@billing_bp.route('/api/billing/invoices/pending', methods=['GET'])
def get_pending_invoices():
    """Get all pending invoices"""
    try:
        pending_invoices = billing_service.get_pending_invoices()
        
        return jsonify({
            'success': True,
            'data': pending_invoices
        })
        
    except Exception as e:
        logger.error(f"Error getting pending invoices: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get pending invoices'
        }), 500

@billing_bp.route('/api/billing/invoices/<int:invoice_id>/finalize', methods=['PUT'])
def finalize_invoice(invoice_id):
    """Finalize a pending invoice"""
    try:
        data = request.get_json()
        
        if not data or 'payment_method' not in data:
            return jsonify({
                'success': False,
                'error': 'Payment method is required'
            }), 400
        
        payment_method = data['payment_method']
        success, message = billing_service.finalize_pending_invoice(invoice_id, payment_method)
        
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
        logger.error(f"Error finalizing invoice: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to finalize invoice'
        }), 500

@billing_bp.route('/api/billing/invoices/<int:invoice_id>', methods=['GET'])
def get_invoice_details(invoice_id):
    """Get invoice details"""
    try:
        invoice_details = billing_service.get_invoice_details(invoice_id)
        
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
        logger.error(f"Error getting invoice details: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get invoice details'
        }), 500

@billing_bp.route('/api/billing/invoices/<int:invoice_id>/print', methods=['GET'])
def print_invoice(invoice_id):
    """Generate printable invoice HTML"""
    try:
        html_content = print_service.generate_invoice_html(invoice_id)
        
        if not html_content:
            return jsonify({
                'success': False,
                'error': 'Invoice not found or could not generate print version'
            }), 404
        
        return html_content, 200, {'Content-Type': 'text/html'}
        
    except Exception as e:
        logger.error(f"Error generating invoice print: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate invoice print'
        }), 500

@billing_bp.route('/api/billing/invoices/<int:invoice_id>/pdf', methods=['GET'])
def download_invoice_pdf(invoice_id):
    """Download invoice as PDF"""
    try:
        pdf_content = print_service.generate_invoice_pdf(invoice_id)
        
        if not pdf_content:
            return jsonify({
                'success': False,
                'error': 'PDF generation not available'
            }), 501
        
        return pdf_content, 200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': f'attachment; filename="invoice_{invoice_id}.pdf"'
        }
        
    except Exception as e:
        logger.error(f"Error generating invoice PDF: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate invoice PDF'
        }), 500