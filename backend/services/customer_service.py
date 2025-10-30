"""
Customer Service - Handles customer management and credit operations
"""
import sqlite3
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from models.database import get_database_manager

logger = logging.getLogger(__name__)

class CustomerService:
    """Service for handling customer operations"""
    
    def __init__(self):
        self.db_manager = get_database_manager()
    
    def get_all_customers(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all customers with pagination - now only returns customers with actual purchases"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Since we cleaned orphaned customers, all remaining customers should have purchases
                sql = """
                SELECT c.customer_id, c.name, c.phone, c.email, c.address, c.city, c.state, c.zip_code,
                       c.date_of_birth, c.gender, c.is_active_customer, c.outstanding_credit,
                       c.payment_status, c.created_at, c.updated_at,
                       COUNT(DISTINCT s.invoice_id) as total_purchases,
                       COALESCE(SUM(s.total_amount), 0) as total_spent
                FROM Customers c
                LEFT JOIN Sales s ON c.customer_id = s.customer_id
                GROUP BY c.customer_id
                ORDER BY total_purchases DESC, total_spent DESC, c.name
                LIMIT ? OFFSET ?
                """
                
                cursor.execute(sql, (limit, offset))
                results = cursor.fetchall()
                
                customers = []
                for row in results:
                    customers.append({
                        'customer_id': row[0],
                        'name': row[1],
                        'phone': row[2],
                        'email': row[3],
                        'address': row[4],
                        'city': row[5],
                        'state': row[6],
                        'zip_code': row[7],
                        'date_of_birth': row[8],
                        'gender': row[9],
                        'is_active_customer': bool(row[10]),
                        'outstanding_credit': row[11],
                        'payment_status': row[12],
                        'created_at': row[13],
                        'updated_at': row[14],
                        'total_purchases': row[15],
                        'total_spent': row[16]
                    })
                
                return customers
                
        except Exception as e:
            logger.error(f"Error getting all customers: {e}")
            return []
    
    def get_customer_by_id(self, customer_id: int) -> Optional[Dict[str, Any]]:
        """Get customer by ID"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                sql = """
                SELECT customer_id, name, phone, email, address, city, state, zip_code,
                       date_of_birth, gender, is_active_customer, outstanding_credit,
                       payment_status, created_at, updated_at
                FROM Customers
                WHERE customer_id = ?
                """
                
                cursor.execute(sql, (customer_id,))
                result = cursor.fetchone()
                
                if result:
                    return {
                        'customer_id': result[0],
                        'name': result[1],
                        'phone': result[2],
                        'email': result[3],
                        'address': result[4],
                        'city': result[5],
                        'state': result[6],
                        'zip_code': result[7],
                        'date_of_birth': result[8],
                        'gender': result[9],
                        'is_active_customer': bool(result[10]),
                        'outstanding_credit': result[11],
                        'payment_status': result[12],
                        'created_at': result[13],
                        'updated_at': result[14]
                    }
                
                return None
                
        except Exception as e:
            logger.error(f"Error getting customer by ID: {e}")
            return None
    
    def search_customers(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search customers by name, phone, or email - now only searches customers with purchases"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # If query is empty or too short, return top customers by purchases
                if not query or len(query.strip()) < 2:
                    sql = """
                    SELECT c.customer_id, c.name, c.phone, c.email, c.address, c.city, c.state, c.zip_code,
                           c.date_of_birth, c.gender, c.is_active_customer, c.outstanding_credit,
                           c.payment_status, c.created_at, c.updated_at,
                           COUNT(DISTINCT s.invoice_id) as total_purchases,
                           COALESCE(SUM(s.total_amount), 0) as total_spent
                    FROM Customers c
                    LEFT JOIN Sales s ON c.customer_id = s.customer_id
                    GROUP BY c.customer_id
                    ORDER BY total_purchases DESC, total_spent DESC, c.name
                    LIMIT ?
                    """
                    cursor.execute(sql, (limit,))
                else:
                    search_query = f"%{query.strip()}%"
                    sql = """
                    SELECT c.customer_id, c.name, c.phone, c.email, c.address, c.city, c.state, c.zip_code,
                           c.date_of_birth, c.gender, c.is_active_customer, c.outstanding_credit,
                           c.payment_status, c.created_at, c.updated_at,
                           COUNT(DISTINCT s.invoice_id) as total_purchases,
                           COALESCE(SUM(s.total_amount), 0) as total_spent
                    FROM Customers c
                    LEFT JOIN Sales s ON c.customer_id = s.customer_id
                    WHERE (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)
                    GROUP BY c.customer_id
                    ORDER BY total_purchases DESC, total_spent DESC, c.name
                    LIMIT ?
                    """
                    cursor.execute(sql, (search_query, search_query, search_query, limit))
                
                results = cursor.fetchall()
                
                customers = []
                for row in results:
                    customers.append({
                        'customer_id': row[0],
                        'name': row[1],
                        'phone': row[2],
                        'email': row[3],
                        'address': row[4],
                        'city': row[5],
                        'state': row[6],
                        'zip_code': row[7],
                        'date_of_birth': row[8],
                        'gender': row[9],
                        'is_active_customer': bool(row[10]),
                        'outstanding_credit': row[11],
                        'payment_status': row[12],
                        'created_at': row[13],
                        'updated_at': row[14],
                        'total_purchases': row[15],
                        'total_spent': row[16]
                    })
                
                return customers
                
        except Exception as e:
            logger.error(f"Error searching customers: {e}")
            return []
    
    
    def update_customer(self, customer_id: int, customer_data: Dict[str, Any]) -> bool:
        """Update customer information"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Build dynamic update query
                update_fields = []
                values = []
                
                for field, value in customer_data.items():
                    if field != 'customer_id' and value is not None:
                        update_fields.append(f"{field} = ?")
                        values.append(value)
                
                if not update_fields:
                    return False
                
                values.append(datetime.now())  # updated_at
                values.append(customer_id)     # WHERE condition
                
                sql = f"""
                UPDATE Customers 
                SET {', '.join(update_fields)}, updated_at = ?
                WHERE customer_id = ?
                """
                
                cursor.execute(sql, values)
                
                return cursor.rowcount > 0
                
        except Exception as e:
            logger.error(f"Error updating customer: {e}")
            return False
    
    def delete_customer(self, customer_id: int) -> bool:
        """Delete customer"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                sql = "DELETE FROM Customers WHERE customer_id = ?"
                cursor.execute(sql, (customer_id,))
                
                return cursor.rowcount > 0
                
        except Exception as e:
            logger.error(f"Error deleting customer: {e}")
            return False
    
    def get_customer_statistics(self, customer_id: int) -> Optional[Dict[str, Any]]:
        """Get customer statistics"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get purchase statistics
                stats_sql = """
                SELECT 
                    COUNT(DISTINCT s.invoice_id) as total_purchases,
                    COALESCE(SUM(s.total_amount), 0) as total_spent,
                    COALESCE(AVG(s.total_amount), 0) as average_order_value,
                    MAX(s.date_of_sale) as last_purchase_date,
                    COALESCE(SUM(CASE WHEN mr.return_id IS NOT NULL THEN 1 ELSE 0 END), 0) as total_returns
                FROM Sales s
                LEFT JOIN Medicine_Return mr ON s.sale_id = mr.sale_id
                WHERE s.customer_id = ?
                """
                
                cursor.execute(stats_sql, (customer_id,))
                result = cursor.fetchone()
                
                if result:
                    return {
                        'total_purchases': result[0],
                        'total_spent': result[1],
                        'average_order_value': result[2],
                        'last_purchase_date': result[3],
                        'total_returns': result[4]
                    }
                
                return None
                
        except Exception as e:
            logger.error(f"Error getting customer statistics: {e}")
            return None
    
    def pay_credit(self, customer_id: int, payment_data: Dict[str, Any]) -> bool:
        """Process credit payment"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Start transaction
                cursor.execute("BEGIN TRANSACTION")
                
                # Update customer credit
                credit_sql = """
                UPDATE Customers 
                SET outstanding_credit = outstanding_credit - ?
                WHERE customer_id = ? AND outstanding_credit >= ?
                """
                
                cursor.execute(credit_sql, (
                    payment_data['amount'],
                    customer_id,
                    payment_data['amount']
                ))
                
                if cursor.rowcount == 0:
                    cursor.execute("ROLLBACK")
                    return False
                
                # Create payment record (you might want to add a payments table)
                # For now, we'll just update the credit
                
                # Commit transaction
                cursor.execute("COMMIT")
                
                return True
                
        except Exception as e:
            logger.error(f"Error processing credit payment: {e}")
            return False
    
    def get_credit_summary(self, customer_id: int) -> Optional[Dict[str, Any]]:
        """Get customer credit summary"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                sql = """
                SELECT outstanding_credit, payment_status
                FROM Customers
                WHERE customer_id = ?
                """
                
                cursor.execute(sql, (customer_id,))
                result = cursor.fetchone()
                
                if result:
                    return {
                        'outstanding_credit': result[0],
                        'payment_status': result[1],
                        'has_outstanding_credit': result[0] > 0
                    }
                
                return None
                
        except Exception as e:
            logger.error(f"Error getting credit summary: {e}")
            return None
    
    def create_customer(self, customer_data: Dict[str, Any]) -> Tuple[bool, Optional[int], str]:
        """Create a new customer"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                sql = """
                INSERT INTO Customers (name, phone, email, address, city, state, zip_code,
                                     date_of_birth, gender, is_active_customer, outstanding_credit,
                                     payment_status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                
                current_time = datetime.now()
                cursor.execute(sql, (
                    customer_data['name'],
                    customer_data['phone'],
                    customer_data.get('email'),
                    customer_data['address'],
                    customer_data.get('city'),
                    customer_data.get('state'),
                    customer_data.get('zip_code'),
                    customer_data.get('date_of_birth'),
                    customer_data.get('gender'),
                    True,  # is_active_customer
                    0.0,   # outstanding_credit
                    'Good',  # payment_status
                    current_time,
                    current_time
                ))
                
                customer_id = cursor.lastrowid
                conn.commit()  # Commit the transaction
                return (True, customer_id, 'Customer created successfully')
                
        except Exception as e:
            logger.error(f"Error creating customer: {e}")
            return (False, None, str(e))
    
    def update_customer(self, customer_id: int, customer_data: Dict[str, Any]) -> Tuple[bool, str]:
        """Update customer details"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Build dynamic update query
                update_fields = []
                values = []
                
                for field, value in customer_data.items():
                    if field in ['name', 'phone', 'email', 'address', 'city', 'state', 'zip_code', 'date_of_birth', 'gender']:
                        update_fields.append(f"{field} = ?")
                        values.append(value)
                
                if not update_fields:
                    return (False, "No valid fields to update")
                
                update_fields.append("updated_at = ?")
                values.append(datetime.now())
                values.append(customer_id)
                
                sql = f"""
                UPDATE Customers 
                SET {', '.join(update_fields)}
                WHERE customer_id = ?
                """
                
                cursor.execute(sql, values)
                
                if cursor.rowcount == 0:
                    return (False, "Customer not found")
                
                return (True, "Customer updated successfully")
                
        except Exception as e:
            logger.error(f"Error updating customer: {e}")
            return (False, str(e))
    
    def delete_customer(self, customer_id: int) -> Tuple[bool, str]:
        """Soft delete customer (set is_active=False)"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                sql = """
                UPDATE Customers 
                SET is_active_customer = 0, updated_at = ?
                WHERE customer_id = ?
                """
                
                cursor.execute(sql, (datetime.now(), customer_id))
                
                if cursor.rowcount == 0:
                    return (False, "Customer not found")
                
                return (True, "Customer deleted successfully")
                
        except Exception as e:
            logger.error(f"Error deleting customer: {e}")
            return (False, str(e))
    
    
    def get_purchase_history(self, customer_id: int) -> List[Dict[str, Any]]:
        """Get customer's purchase history"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                sql = """
                SELECT i.invoice_id, i.sale_date, i.total_amount, i.payment_method, 
                       i.payment_status, i.created_at
                FROM Invoice i
                WHERE i.customer_id = ?
                ORDER BY i.sale_date DESC
                """
                
                cursor.execute(sql, (customer_id,))
                results = cursor.fetchall()
                
                purchases = []
                for row in results:
                    purchases.append({
                        'invoice_id': row[0],
                        'sale_date': row[1],
                        'total_amount': row[2],
                        'payment_method': row[3],
                        'payment_status': row[4],
                        'created_at': row[5]
                    })
                
                return purchases
                
        except Exception as e:
            logger.error(f"Error getting purchase history: {e}")
            return []

# Create service instance
customer_service = CustomerService()