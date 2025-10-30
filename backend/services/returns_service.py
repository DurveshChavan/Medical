"""
Returns Service - Handles medicine returns and refunds
"""
import sqlite3
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from models.database import get_database_manager

logger = logging.getLogger(__name__)

class ReturnsService:
    """Service for handling returns and refunds"""
    
    def __init__(self):
        self.db_manager = get_database_manager()
    
    def search_invoices_for_return(self, query: str) -> List[Dict[str, Any]]:
        """Search invoices for return processing"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Search by invoice ID or customer name/phone
                search_sql = """
                SELECT DISTINCT i.invoice_id, i.sale_date, i.customer_id, 
                       COALESCE(c.name, 'Walk-in Customer') as customer_name,
                       COALESCE(c.phone, 'N/A') as customer_phone,
                       i.total_amount, i.payment_method, i.payment_status, i.created_at
                FROM Invoice i
                LEFT JOIN Customers c ON i.customer_id = c.customer_id
                WHERE i.invoice_id LIKE ? OR c.name LIKE ? OR c.phone LIKE ?
                ORDER BY i.sale_date DESC
                LIMIT 20
                """
                
                search_term = f"%{query}%"
                cursor.execute(search_sql, (search_term, search_term, search_term))
                results = cursor.fetchall()
                
                invoices = []
                for row in results:
                    invoices.append({
                        'invoice_id': row[0],
                        'sale_date': row[1],
                        'customer_id': row[2],
                        'customer_name': row[3],
                        'customer_phone': row[4],
                        'total_amount': row[5],
                        'payment_method': row[6],
                        'payment_status': row[7],
                        'created_at': row[8]
                    })
                
                return invoices
                
        except Exception as e:
            logger.error(f"Error searching invoices for return: {e}")
            return []

    def get_invoice_for_return(self, invoice_id: int) -> Optional[Dict[str, Any]]:
        """Get invoice details for return processing"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get invoice details
                invoice_sql = """
                SELECT i.invoice_id, i.sale_date, i.customer_id, c.name as customer_name,
                       c.phone as customer_phone, c.email as customer_email,
                       i.total_amount, i.payment_method, i.payment_status, i.created_at
                FROM Invoice i
                LEFT JOIN Customers c ON i.customer_id = c.customer_id
                WHERE i.invoice_id = ?
                """
                
                cursor.execute(invoice_sql, (invoice_id,))
                invoice_result = cursor.fetchone()
                
                if not invoice_result:
                    return None
                
                # Get sales items
                items_sql = """
                SELECT s.sale_id, s.medicine_id, m.medicine_name, m.generic_name, m.brand,
                       s.quantity_sold, s.unit_price_at_sale, s.total_amount
                FROM Sales s
                JOIN Medicines m ON s.medicine_id = m.medicine_id
                WHERE s.invoice_id = ?
                ORDER BY s.sale_id
                """
                
                cursor.execute(items_sql, (invoice_id,))
                items_results = cursor.fetchall()
                
                items = []
                for row in items_results:
                    items.append({
                        'sale_id': row[0],
                        'medicine_id': row[1],
                        'medicine_name': row[2],
                        'generic_name': row[3],
                        'brand': row[4],
                        'quantity_sold': row[5],
                        'unit_price_at_sale': row[6],
                        'total_amount': row[7]
                    })
                
                return {
                    'invoice_id': invoice_result[0],
                    'sale_date': invoice_result[1],
                    'customer_id': invoice_result[2],
                    'customer_name': invoice_result[3],
                    'customer_phone': invoice_result[4],
                    'customer_email': invoice_result[5],
                    'total_amount': invoice_result[6],
                    'payment_method': invoice_result[7],
                    'payment_status': invoice_result[8],
                    'created_at': invoice_result[9],
                    'items': items
                }
                
        except Exception as e:
            logger.error(f"Error getting invoice for return: {e}")
            return None
    
    def search_invoices(self, query: str) -> List[Dict[str, Any]]:
        """Search invoices for return processing"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                search_query = f"%{query}%"
                
                sql = """
                SELECT DISTINCT i.invoice_id, i.sale_date, i.customer_id, c.name as customer_name,
                       c.phone as customer_phone, c.email as customer_email,
                       i.total_amount, i.payment_method, i.payment_status, i.created_at
                FROM Invoice i
                LEFT JOIN Customers c ON i.customer_id = c.customer_id
                WHERE (i.invoice_id LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)
                ORDER BY i.created_at DESC
                LIMIT 20
                """
                
                cursor.execute(sql, (search_query, search_query, search_query))
                results = cursor.fetchall()
                
                invoices = []
                for row in results:
                    invoices.append({
                        'invoice_id': row[0],
                        'sale_date': row[1],
                        'customer_id': row[2],
                        'customer_name': row[3] or 'Walk-in Customer',
                        'customer_phone': row[4],
                        'customer_email': row[5],
                        'total_amount': row[6],
                        'payment_method': row[7],
                        'payment_status': row[8],
                        'created_at': row[9]
                    })
                
                return invoices
                
        except Exception as e:
            logger.error(f"Error searching invoices: {e}")
            return []
    
    def create_return(self, return_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a medicine return"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Start transaction
                cursor.execute("BEGIN TRANSACTION")
                
                # Create return entry
                return_sql = """
                INSERT INTO Medicine_Return (sale_id, customer_id, medicine_id, quantity_returned,
                                          reason_for_return, return_date, refund_amount, processed_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                
                current_time = datetime.now()
                cursor.execute(return_sql, (
                    return_data['sale_id'],
                    return_data['customer_id'],
                    return_data['medicine_id'],
                    return_data['quantity_returned'],
                    return_data['reason_for_return'],
                    current_time.date(),
                    return_data['refund_amount'],
                    return_data.get('processed_by', 1),  # Default user ID
                    current_time
                ))
                
                return_id = cursor.lastrowid
                
                # Update inventory (add back returned quantity)
                inventory_sql = """
                UPDATE Inventory 
                SET quantity_in_stock = quantity_in_stock + ?
                WHERE medicine_id = ?
                """
                
                cursor.execute(inventory_sql, (
                    return_data['quantity_returned'],
                    return_data['medicine_id']
                ))
                
                # Commit transaction
                cursor.execute("COMMIT")
                
                return {
                    'return_id': return_id,
                    'message': 'Return created successfully'
                }
                
        except Exception as e:
            logger.error(f"Error creating return: {e}")
            return None
    
    def process_refund(self, return_id: int, refund_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process a refund for a return"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Create refund entry
                refund_sql = """
                INSERT INTO Refund (return_id, customer_id, payment_method, refund_amount,
                                  refund_date, approved_by, refund_reason, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """
                
                current_time = datetime.now()
                cursor.execute(refund_sql, (
                    return_id,
                    refund_data['customer_id'],
                    refund_data['payment_method'],
                    refund_data['refund_amount'],
                    current_time.date(),
                    refund_data.get('approved_by', 1),  # Default user ID
                    refund_data['refund_reason'],
                    current_time
                ))
                
                refund_id = cursor.lastrowid
                
                return {
                    'refund_id': refund_id,
                    'message': 'Refund processed successfully'
                }
                
        except Exception as e:
            logger.error(f"Error processing refund: {e}")
            return None
    
    def get_return_history(self, customer_id: Optional[int] = None, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get return history with pagination"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                if customer_id:
                    sql = """
                    SELECT mr.return_id, mr.sale_id, mr.customer_id, c.name as customer_name,
                           mr.medicine_id, m.medicine_name, mr.quantity_returned,
                           mr.reason_for_return, mr.return_date, mr.refund_amount,
                           mr.processed_by, mr.created_at
                    FROM Medicine_Return mr
                    JOIN Customers c ON mr.customer_id = c.customer_id
                    JOIN Medicines m ON mr.medicine_id = m.medicine_id
                    WHERE mr.customer_id = ?
                    ORDER BY mr.created_at DESC
                    LIMIT ? OFFSET ?
                    """
                    cursor.execute(sql, (customer_id, limit, offset))
                else:
                    sql = """
                    SELECT mr.return_id, mr.sale_id, mr.customer_id, c.name as customer_name,
                           mr.medicine_id, m.medicine_name, mr.quantity_returned,
                           mr.reason_for_return, mr.return_date, mr.refund_amount,
                           mr.processed_by, mr.created_at
                    FROM Medicine_Return mr
                    JOIN Customers c ON mr.customer_id = c.customer_id
                    JOIN Medicines m ON mr.medicine_id = m.medicine_id
                    ORDER BY mr.created_at DESC
                    LIMIT ? OFFSET ?
                    """
                    cursor.execute(sql, (limit, offset))
                
                results = cursor.fetchall()
                
                returns = []
                for row in results:
                    returns.append({
                        'return_id': row[0],
                        'sale_id': row[1],
                        'customer_id': row[2],
                        'customer_name': row[3],
                        'medicine_id': row[4],
                        'medicine_name': row[5],
                        'quantity_returned': row[6],
                        'reason_for_return': row[7],
                        'return_date': row[8],
                        'refund_amount': row[9],
                        'processed_by': row[10],
                        'created_at': row[11]
                    })
                
                return returns
                
        except Exception as e:
            logger.error(f"Error getting return history: {e}")
            return []
    
    def get_refund_history(self, customer_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get refund history"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                if customer_id:
                    sql = """
                    SELECT r.refund_id, r.return_id, r.customer_id, c.name as customer_name,
                           r.payment_method, r.refund_amount, r.refund_date,
                           r.approved_by, r.refund_reason, r.created_at
                    FROM Refund r
                    JOIN Customers c ON r.customer_id = c.customer_id
                    WHERE r.customer_id = ?
                    ORDER BY r.created_at DESC
                    """
                    cursor.execute(sql, (customer_id,))
                else:
                    sql = """
                    SELECT r.refund_id, r.return_id, r.customer_id, c.name as customer_name,
                           r.payment_method, r.refund_amount, r.refund_date,
                           r.approved_by, r.refund_reason, r.created_at
                    FROM Refund r
                    JOIN Customers c ON r.customer_id = c.customer_id
                    ORDER BY r.created_at DESC
                    """
                    cursor.execute(sql)
                
                results = cursor.fetchall()
                
                refunds = []
                for row in results:
                    refunds.append({
                        'refund_id': row[0],
                        'return_id': row[1],
                        'customer_id': row[2],
                        'customer_name': row[3],
                        'payment_method': row[4],
                        'refund_amount': row[5],
                        'refund_date': row[6],
                        'approved_by': row[7],
                        'refund_reason': row[8],
                        'created_at': row[9]
                    })
                
                return refunds
                
        except Exception as e:
            logger.error(f"Error getting refund history: {e}")
            return []

# Create service instance
returns_service = ReturnsService()