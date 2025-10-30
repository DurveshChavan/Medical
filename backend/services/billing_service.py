"""
Billing Service - Handles POS billing operations
"""
import sqlite3
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from models.database import get_database_manager

logger = logging.getLogger(__name__)

class BillingService:
    """Service for handling billing operations"""
    
    def __init__(self):
        self.db_manager = get_database_manager()
    
    def get_medicine_stock(self, medicine_id: int) -> Optional[Dict[str, Any]]:
        """Get medicine stock information"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                query = """
                SELECT i.inventory_id, i.medicine_id, m.medicine_name, m.generic_name, 
                       m.brand, m.dosage_form, m.strength, m.category,
                       i.quantity_in_stock, i.selling_price_per_unit, i.batch_number, 
                       i.expiry_date, i.supplier_id, s.supplier_name
                FROM Inventory i
                JOIN Medicines m ON i.medicine_id = m.medicine_id
                LEFT JOIN Suppliers s ON i.supplier_id = s.supplier_id
                WHERE i.medicine_id = ? AND i.quantity_in_stock > 0
                ORDER BY i.expiry_date ASC
                LIMIT 1
                """
                
                cursor.execute(query, (medicine_id,))
                result = cursor.fetchone()
                
                if result:
                    return {
                        'inventory_id': result[0],
                        'medicine_id': result[1],
                        'medicine_name': result[2],
                        'generic_name': result[3],
                        'brand': result[4],
                        'dosage_form': result[5],
                        'strength': result[6],
                        'category': result[7],
                        'quantity_in_stock': result[8],
                        'selling_price_per_unit': result[9],
                        'batch_number': result[10],
                        'expiry_date': result[11],
                        'supplier_id': result[12],
                        'supplier_name': result[13]
                    }
                
                return None
                
        except Exception as e:
            logger.error(f"Error getting medicine stock: {e}")
            return None
    
    def search_medicines(self, query: str) -> List[Dict[str, Any]]:
        """Search medicines by name, generic name, or brand"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                search_query = f"%{query}%"
                
                sql = """
                SELECT DISTINCT m.medicine_id, m.medicine_name, m.generic_name, m.brand,
                       m.dosage_form, m.strength, m.category, m.prescription_required,
                       COALESCE(SUM(i.quantity_in_stock), 0) as total_stock,
                       COALESCE(AVG(i.selling_price_per_unit), 0) as avg_price
                FROM Medicines m
                LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id
                WHERE (m.medicine_name LIKE ? OR m.generic_name LIKE ? OR m.brand LIKE ?)
                AND m.is_active = 1
                GROUP BY m.medicine_id, m.medicine_name, m.generic_name, m.brand,
                         m.dosage_form, m.strength, m.category, m.prescription_required
                HAVING total_stock > 0
                ORDER BY m.medicine_name
                LIMIT 20
                """
                
                cursor.execute(sql, (search_query, search_query, search_query))
                results = cursor.fetchall()
                
                medicines = []
                for row in results:
                    medicines.append({
                        'medicine_id': row[0],
                        'medicine_name': row[1],
                        'generic_name': row[2],
                        'brand': row[3],
                        'dosage_form': row[4],
                        'strength': row[5],
                        'category': row[6],
                        'prescription_required': bool(row[7]),
                        'total_stock': row[8],
                        'avg_price': float(row[9])
                    })
                
                return medicines
                
        except Exception as e:
            logger.error(f"Error searching medicines: {e}")
            return []
    
    def create_invoice(self, invoice_data: Dict[str, Any]) -> Tuple[bool, Optional[int], str]:
        """Create a new invoice with sales entries"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Start transaction
                cursor.execute("BEGIN TRANSACTION")
                
                # Calculate totals from cart_items
                cart_items = invoice_data.get('cart_items', [])
                if not cart_items:
                    return (False, None, "No items in cart")
                
                subtotal = sum(item['total_amount'] for item in cart_items)
                gst_amount = subtotal * 0.18
                total_amount = subtotal + gst_amount
                
                # Create invoice
                current_time = datetime.now()
                invoice_sql = """
                INSERT INTO Invoice (sale_date, customer_id, total_amount, total_gst, 
                                   payment_method, payment_status, outstanding_credit, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """
                
                cursor.execute(invoice_sql, (
                    current_time.date(),
                    invoice_data.get('customer_id'),
                    total_amount,
                    gst_amount,
                    invoice_data['payment_method'],
                    invoice_data['payment_status'],
                    invoice_data.get('outstanding_credit', 0),
                    current_time
                ))
                
                invoice_id = cursor.lastrowid
                
                # Create sales entries and update inventory
                for item in cart_items:
                    # Create sales entry
                    sales_sql = """
                    INSERT INTO Sales (invoice_id, date_of_sale, time_of_sale, medicine_id,
                                     quantity_sold, unit_price_at_sale, total_amount, customer_id,
                                     payment_method, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """
                    
                    cursor.execute(sales_sql, (
                        invoice_id,
                        current_time.date(),
                        current_time.strftime('%H:%M:%S'),
                        item['medicine_id'],
                        item['quantity'],
                        item['unit_price'],
                        item['total_amount'],
                        invoice_data.get('customer_id'),
                        invoice_data['payment_method'],
                        current_time
                    ))
                    
                    # Update inventory
                    inventory_sql = """
                    UPDATE Inventory 
                    SET quantity_in_stock = quantity_in_stock - ?
                    WHERE medicine_id = ? AND quantity_in_stock >= ?
                    """
                    
                    cursor.execute(inventory_sql, (
                        item['quantity'],
                        item['medicine_id'],
                        item['quantity']
                    ))
                    
                    if cursor.rowcount == 0:
                        raise Exception(f"Insufficient stock for {item.get('medicine_name', 'medicine')}")
                
                # Update customer credit if payment method is 'Credit'
                if invoice_data['payment_method'] == 'Credit' and invoice_data.get('customer_id'):
                    credit_sql = """
                    UPDATE Customers 
                    SET outstanding_credit = outstanding_credit + ?
                    WHERE customer_id = ?
                    """
                    cursor.execute(credit_sql, (total_amount, invoice_data['customer_id']))
                
                # Commit transaction
                cursor.execute("COMMIT")
                
                return (True, invoice_id, 'Invoice created successfully')
                
        except Exception as e:
            logger.error(f"Error creating invoice: {e}")
            return (False, None, str(e))
    
    def get_pending_invoices(self) -> List[Dict[str, Any]]:
        """Get all pending invoices"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                sql = """
                SELECT i.invoice_id, i.sale_date, i.customer_id, c.name as customer_name,
                       i.total_amount, i.payment_method, i.payment_status, i.created_at
                FROM Invoice i
                LEFT JOIN Customers c ON i.customer_id = c.customer_id
                WHERE i.payment_status = 'pending'
                ORDER BY i.created_at DESC
                """
                
                cursor.execute(sql)
                results = cursor.fetchall()
                
                invoices = []
                for row in results:
                    invoices.append({
                        'invoice_id': row[0],
                        'sale_date': row[1],
                        'customer_id': row[2],
                        'customer_name': row[3] or 'Walk-in Customer',
                        'total_amount': row[4],
                        'payment_method': row[5],
                        'payment_status': row[6],
                        'created_at': row[7]
                    })
                
                return invoices
                
        except Exception as e:
            logger.error(f"Error getting pending invoices: {e}")
            return []
    
    def finalize_invoice(self, invoice_id: int, payment_method: str) -> bool:
        """Finalize a pending invoice"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Update invoice status
                sql = """
                UPDATE Invoice 
                SET payment_status = 'paid', payment_method = ?, updated_at = ?
                WHERE invoice_id = ? AND payment_status = 'pending'
                """
                
                cursor.execute(sql, (payment_method, datetime.now(), invoice_id))
                
                if cursor.rowcount > 0:
                    return True
                else:
                    return False
                    
        except Exception as e:
            logger.error(f"Error finalizing invoice: {e}")
            return False
    
    def get_invoice_details(self, invoice_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed invoice information"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get invoice details
                invoice_sql = """
                SELECT i.invoice_id, i.sale_date, i.customer_id, c.name as customer_name,
                       c.phone as customer_phone, c.email as customer_email,
                       i.total_amount, i.total_gst, i.payment_method, i.payment_status,
                       i.outstanding_credit, i.created_at
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
                    'total_gst': invoice_result[7],
                    'payment_method': invoice_result[8],
                    'payment_status': invoice_result[9],
                    'outstanding_credit': invoice_result[10],
                    'created_at': invoice_result[11],
                    'items': items
                }
                
        except Exception as e:
            logger.error(f"Error getting invoice details: {e}")
            return None

# Create service instance
billing_service = BillingService()