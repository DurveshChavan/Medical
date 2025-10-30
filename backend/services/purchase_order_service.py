"""
Purchase Order Service
======================
Handles all purchase order-related business logic and database operations.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date
from models.database import get_database_manager

logger = logging.getLogger(__name__)


class PurchaseOrderService:
    """Service class for purchase order operations."""
    
    def __init__(self):
        self.db_manager = get_database_manager()
    
    def create_purchase_order(self, supplier_id: int, items: List[Dict[str, Any]], total_amount: float) -> Dict[str, Any]:
        """
        Create a new purchase order.
        
        Args:
            supplier_id (int): Supplier ID
            items (List[Dict[str, Any]]): List of items to purchase
            total_amount (float): Total amount of the order
            
        Returns:
            Dict[str, Any]: Response with created purchase order
        """
        try:
            # Validate required fields
            if not items:
                return {
                    'success': False,
                    'error': 'No items provided for purchase order'
                }
            
            # Generate invoice number
            invoice_number = f"PO-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Start transaction
                cursor.execute("BEGIN TRANSACTION")
                
                try:
                    # Create purchase invoice
                    invoice_query = """
                        INSERT INTO Purchase_Invoice (
                            supplier_id, invoice_number, purchase_date, total_amount, payment_status
                        ) VALUES (?, ?, ?, ?, ?)
                    """
                    cursor.execute(invoice_query, (
                        supplier_id,
                        invoice_number,
                        datetime.now().date(),
                        total_amount,
                        'pending'
                    ))
                    
                    purchase_invoice_id = cursor.lastrowid
                    
                    # Create purchase items
                    for item in items:
                        item_query = """
                            INSERT INTO Purchase_Item (
                                purchase_invoice_id, medicine_id, supplier_id, batch_number,
                                expiry_date, quantity_purchased, cost_per_unit, total_cost
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """
                        cursor.execute(item_query, (
                            purchase_invoice_id,
                            item['medicine_id'],
                            supplier_id,
                            item.get('batch_number'),
                            item.get('expiry_date'),
                            item['quantity_purchased'],
                            item['cost_per_unit'],
                            item['total_cost']
                        ))
                    
                    # Commit transaction
                    conn.commit()
                    
                    # Return created purchase order
                    return self.get_purchase_order_details(purchase_invoice_id)
                    
                except Exception as e:
                    # Rollback transaction
                    conn.rollback()
                    raise e
                    
        except Exception as e:
            logger.error(f"Error creating purchase order: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_pending_orders(self, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """
        Get all pending purchase orders.
        
        Args:
            page (int): Page number (1-based)
            limit (int): Number of records per page
            
        Returns:
            Dict[str, Any]: Response with pending orders and pagination info
        """
        try:
            offset = (page - 1) * limit
            
            query = """
                SELECT 
                    pi.purchase_invoice_id, pi.supplier_id, s.supplier_name,
                    pi.invoice_number, pi.purchase_date, pi.total_amount,
                    pi.payment_status, pi.created_at
                FROM Purchase_Invoice pi
                JOIN Suppliers s ON pi.supplier_id = s.supplier_id
                WHERE pi.payment_status = 'pending'
                ORDER BY pi.purchase_date DESC
                LIMIT ? OFFSET ?
            """
            
            count_query = "SELECT COUNT(*) FROM Purchase_Invoice WHERE payment_status = 'pending'"
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get total count
                cursor.execute(count_query)
                total_count = cursor.fetchone()[0]
                
                # Get pending orders
                cursor.execute(query, (limit, offset))
                orders = cursor.fetchall()
                
                orders_list = []
                for order in orders:
                    orders_list.append({
                        'purchase_invoice_id': order[0],
                        'supplier_id': order[1],
                        'supplier_name': order[2],
                        'invoice_number': order[3],
                        'purchase_date': order[4],
                        'total_amount': float(order[5]),
                        'payment_status': order[6],
                        'created_at': order[7]
                    })
                
                return {
                    'success': True,
                    'data': orders_list,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting pending orders: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }
    
    def finalize_purchase_order(self, purchase_invoice_id: int) -> Dict[str, Any]:
        """
        Finalize a purchase order and update inventory.
        
        Args:
            purchase_invoice_id (int): Purchase invoice ID
            
        Returns:
            Dict[str, Any]: Response
        """
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Start transaction
                cursor.execute("BEGIN TRANSACTION")
                
                try:
                    # Update payment status
                    update_invoice_query = """
                        UPDATE Purchase_Invoice 
                        SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
                        WHERE purchase_invoice_id = ?
                    """
                    cursor.execute(update_invoice_query, (purchase_invoice_id,))
                    
                    # Get purchase items
                    items_query = """
                        SELECT medicine_id, supplier_id, batch_number, expiry_date,
                               quantity_purchased, cost_per_unit
                        FROM Purchase_Item
                        WHERE purchase_invoice_id = ?
                    """
                    cursor.execute(items_query, (purchase_invoice_id,))
                    items = cursor.fetchall()
                    
                    # Update inventory for each item
                    for item in items:
                        medicine_id, supplier_id, batch_number, expiry_date, quantity, cost_per_unit = item
                        
                        # Check if inventory record exists
                        check_inventory_query = """
                            SELECT inventory_id, quantity_in_stock
                            FROM Inventory
                            WHERE medicine_id = ? AND supplier_id = ? AND batch_number = ?
                        """
                        cursor.execute(check_inventory_query, (medicine_id, supplier_id, batch_number))
                        existing = cursor.fetchone()
                        
                        if existing:
                            # Update existing inventory
                            update_inventory_query = """
                                UPDATE Inventory
                                SET quantity_in_stock = quantity_in_stock + ?,
                                    last_restocked_date = CURRENT_DATE,
                                    updated_at = CURRENT_TIMESTAMP
                                WHERE inventory_id = ?
                            """
                            cursor.execute(update_inventory_query, (quantity, existing[0]))
                        else:
                            # Create new inventory record
                            insert_inventory_query = """
                                INSERT INTO Inventory (
                                    medicine_id, supplier_id, batch_number, expiry_date,
                                    quantity_in_stock, purchase_price_per_unit,
                                    selling_price_per_unit, last_restocked_date
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            """
                            # Set selling price as 1.2x purchase price (20% margin)
                            selling_price = cost_per_unit * 1.2
                            cursor.execute(insert_inventory_query, (
                                medicine_id, supplier_id, batch_number, expiry_date,
                                quantity, cost_per_unit, selling_price, datetime.now().date()
                            ))
                    
                    # Commit transaction
                    conn.commit()
                    
                    return {
                        'success': True,
                        'message': 'Purchase order finalized successfully'
                    }
                    
                except Exception as e:
                    # Rollback transaction
                    conn.rollback()
                    raise e
                    
        except Exception as e:
            logger.error(f"Error finalizing purchase order: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_purchase_order_details(self, purchase_invoice_id: int) -> Dict[str, Any]:
        """
        Get detailed information about a purchase order.
        
        Args:
            purchase_invoice_id (int): Purchase invoice ID
            
        Returns:
            Dict[str, Any]: Response with purchase order details
        """
        try:
            # Get purchase invoice details
            invoice_query = """
                SELECT 
                    pi.purchase_invoice_id, pi.supplier_id, s.supplier_name,
                    pi.invoice_number, pi.purchase_date, pi.total_amount,
                    pi.payment_status, pi.created_at, pi.updated_at
                FROM Purchase_Invoice pi
                JOIN Suppliers s ON pi.supplier_id = s.supplier_id
                WHERE pi.purchase_invoice_id = ?
            """
            
            # Get purchase items
            items_query = """
                SELECT 
                    pi.purchase_item_id, pi.medicine_id, m.medicine_name,
                    pi.batch_number, pi.expiry_date, pi.quantity_purchased,
                    pi.cost_per_unit, pi.total_cost
                FROM Purchase_Item pi
                JOIN Medicines m ON pi.medicine_id = m.medicine_id
                WHERE pi.purchase_invoice_id = ?
                ORDER BY m.medicine_name
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get invoice details
                cursor.execute(invoice_query, (purchase_invoice_id,))
                invoice = cursor.fetchone()
                
                if not invoice:
                    return {
                        'success': False,
                        'error': 'Purchase order not found'
                    }
                
                # Get items
                cursor.execute(items_query, (purchase_invoice_id,))
                items = cursor.fetchall()
                
                items_list = []
                for item in items:
                    items_list.append({
                        'purchase_item_id': item[0],
                        'medicine_id': item[1],
                        'medicine_name': item[2],
                        'batch_number': item[3],
                        'expiry_date': item[4],
                        'quantity_purchased': item[5],
                        'cost_per_unit': float(item[6]),
                        'total_cost': float(item[7])
                    })
                
                invoice_data = {
                    'purchase_invoice_id': invoice[0],
                    'supplier_id': invoice[1],
                    'supplier_name': invoice[2],
                    'invoice_number': invoice[3],
                    'purchase_date': invoice[4],
                    'total_amount': float(invoice[5]),
                    'payment_status': invoice[6],
                    'created_at': invoice[7],
                    'updated_at': invoice[8],
                    'items': items_list
                }
                
                return {
                    'success': True,
                    'data': invoice_data
                }
                
        except Exception as e:
            logger.error(f"Error getting purchase order details: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_supplier_purchase_orders(self, supplier_id: int, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """
        Get purchase orders for a specific supplier.
        
        Args:
            supplier_id (int): Supplier ID
            page (int): Page number (1-based)
            limit (int): Number of records per page
            
        Returns:
            Dict[str, Any]: Response with supplier purchase orders
        """
        try:
            offset = (page - 1) * limit
            
            query = """
                SELECT 
                    pi.purchase_invoice_id, pi.invoice_number, pi.purchase_date,
                    pi.total_amount, pi.payment_status, pi.created_at
                FROM Purchase_Invoice pi
                WHERE pi.supplier_id = ?
                ORDER BY pi.purchase_date DESC
                LIMIT ? OFFSET ?
            """
            
            count_query = "SELECT COUNT(*) FROM Purchase_Invoice WHERE supplier_id = ?"
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get total count
                cursor.execute(count_query, (supplier_id,))
                total_count = cursor.fetchone()[0]
                
                # Get purchase orders
                cursor.execute(query, (supplier_id, limit, offset))
                orders = cursor.fetchall()
                
                orders_list = []
                for order in orders:
                    orders_list.append({
                        'purchase_invoice_id': order[0],
                        'invoice_number': order[1],
                        'purchase_date': order[2],
                        'total_amount': float(order[3]),
                        'payment_status': order[4],
                        'created_at': order[5]
                    })
                
                return {
                    'success': True,
                    'data': orders_list,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting supplier purchase orders: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }


# Global purchase order service instance
purchase_order_service = PurchaseOrderService()