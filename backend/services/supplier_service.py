"""
Supplier Service
================
Handles all supplier-related business logic and database operations.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date
from models.database import get_database_manager

logger = logging.getLogger(__name__)


class SupplierService:
    """Service class for supplier operations."""
    
    def __init__(self):
        self.db_manager = get_database_manager()
    
    def get_all_suppliers(self, page: int = 1, limit: int = 50, active_only: bool = True) -> Dict[str, Any]:
        """
        Get all suppliers with pagination.
        
        Args:
            page (int): Page number (1-based)
            limit (int): Number of records per page
            active_only (bool): If True, only return active suppliers
            
        Returns:
            Dict[str, Any]: Response with suppliers data and pagination info
        """
        try:
            offset = (page - 1) * limit
            
            # Build query
            where_clause = "WHERE is_active = 1" if active_only else ""
            count_query = f"SELECT COUNT(*) FROM Suppliers {where_clause}"
            
            query = f"""
                SELECT 
                    supplier_id, supplier_name, contact_person_name, email, phone,
                    address, city, state, zip_code, country, gstin, pan_number,
                    is_active, created_at, updated_at
                FROM Suppliers 
                {where_clause}
                ORDER BY supplier_name
                LIMIT ? OFFSET ?
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get total count
                cursor.execute(count_query)
                total_count = cursor.fetchone()[0]
                
                # Get suppliers
                cursor.execute(query, (limit, offset))
                suppliers = cursor.fetchall()
                
                # Convert to list of dicts
                suppliers_list = []
                for supplier in suppliers:
                    suppliers_list.append({
                        'supplier_id': supplier[0],
                        'supplier_name': supplier[1],
                        'contact_person_name': supplier[2],
                        'email': supplier[3],
                        'phone': supplier[4],
                        'address': supplier[5],
                        'city': supplier[6],
                        'state': supplier[7],
                        'zip_code': supplier[8],
                        'country': supplier[9],
                        'gstin': supplier[10],
                        'pan_number': supplier[11],
                        'is_active': bool(supplier[12]),
                        'created_at': supplier[13],
                        'updated_at': supplier[14]
                    })
                
                return {
                    'success': True,
                    'data': suppliers_list,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting suppliers: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }
    
    def search_suppliers(self, query: str, active_only: bool = True) -> Dict[str, Any]:
        """
        Search suppliers by name, contact, email, or phone.
        
        Args:
            query (str): Search query
            active_only (bool): If True, only search active suppliers
            
        Returns:
            Dict[str, Any]: Response with matching suppliers
        """
        try:
            search_term = f"%{query}%"
            where_clause = "WHERE is_active = 1" if active_only else ""
            
            if where_clause:
                where_clause += " AND "
            else:
                where_clause = "WHERE "
            
            where_clause += """
                (supplier_name LIKE ? OR 
                 contact_person_name LIKE ? OR 
                 email LIKE ? OR 
                 phone LIKE ?)
            """
            
            query_sql = f"""
                SELECT 
                    supplier_id, supplier_name, contact_person_name, email, phone,
                    address, city, state, zip_code, country, gstin, pan_number,
                    is_active, created_at, updated_at
                FROM Suppliers 
                {where_clause}
                ORDER BY supplier_name
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query_sql, (search_term, search_term, search_term, search_term))
                suppliers = cursor.fetchall()
                
                # Convert to list of dicts
                suppliers_list = []
                for supplier in suppliers:
                    suppliers_list.append({
                        'supplier_id': supplier[0],
                        'supplier_name': supplier[1],
                        'contact_person_name': supplier[2],
                        'email': supplier[3],
                        'phone': supplier[4],
                        'address': supplier[5],
                        'city': supplier[6],
                        'state': supplier[7],
                        'zip_code': supplier[8],
                        'country': supplier[9],
                        'gstin': supplier[10],
                        'pan_number': supplier[11],
                        'is_active': bool(supplier[12]),
                        'created_at': supplier[13],
                        'updated_at': supplier[14]
                    })
                
                return {
                    'success': True,
                    'data': suppliers_list
                }
                
        except Exception as e:
            logger.error(f"Error searching suppliers: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }
    
    def get_supplier_by_id(self, supplier_id: int) -> Dict[str, Any]:
        """
        Get supplier details by ID.
        
        Args:
            supplier_id (int): Supplier ID
            
        Returns:
            Dict[str, Any]: Response with supplier details
        """
        try:
            query = """
                SELECT 
                    supplier_id, supplier_name, contact_person_name, email, phone,
                    address, city, state, zip_code, country, gstin, pan_number,
                    is_active, created_at, updated_at
                FROM Suppliers 
                WHERE supplier_id = ?
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, (supplier_id,))
                supplier = cursor.fetchone()
                
                if supplier:
                    supplier_data = {
                        'supplier_id': supplier[0],
                        'supplier_name': supplier[1],
                        'contact_person_name': supplier[2],
                        'email': supplier[3],
                        'phone': supplier[4],
                        'address': supplier[5],
                        'city': supplier[6],
                        'state': supplier[7],
                        'zip_code': supplier[8],
                        'country': supplier[9],
                        'gstin': supplier[10],
                        'pan_number': supplier[11],
                        'is_active': bool(supplier[12]),
                        'created_at': supplier[13],
                        'updated_at': supplier[14]
                    }
                    
                    return {
                        'success': True,
                        'data': supplier_data
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Supplier not found'
                    }
                    
        except Exception as e:
            logger.error(f"Error getting supplier by ID: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_supplier(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new supplier.
        
        Args:
            data (Dict[str, Any]): Supplier data
            
        Returns:
            Dict[str, Any]: Response with created supplier
        """
        try:
            required_fields = ['supplier_name']
            for field in required_fields:
                if field not in data or not data[field]:
                    return {
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }
            
            query = """
                INSERT INTO Suppliers (
                    supplier_name, contact_person_name, email, phone, address,
                    city, state, zip_code, country, gstin, pan_number, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, (
                    data['supplier_name'],
                    data.get('contact_person_name'),
                    data.get('email'),
                    data.get('phone'),
                    data.get('address'),
                    data.get('city'),
                    data.get('state'),
                    data.get('zip_code'),
                    data.get('country', 'India'),
                    data.get('gstin'),
                    data.get('pan_number'),
                    data.get('is_active', True)
                ))
                
                supplier_id = cursor.lastrowid
                conn.commit()
                
                # Return created supplier
                return self.get_supplier_by_id(supplier_id)
                
        except Exception as e:
            logger.error(f"Error creating supplier: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_supplier(self, supplier_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update supplier information.
        
        Args:
            supplier_id (int): Supplier ID
            data (Dict[str, Any]): Updated supplier data
            
        Returns:
            Dict[str, Any]: Response with updated supplier
        """
        try:
            # Check if supplier exists
            existing = self.get_supplier_by_id(supplier_id)
            if not existing['success']:
                return existing
            
            # Build update query dynamically
            update_fields = []
            values = []
            
            allowed_fields = [
                'supplier_name', 'contact_person_name', 'email', 'phone',
                'address', 'city', 'state', 'zip_code', 'country',
                'gstin', 'pan_number', 'is_active'
            ]
            
            for field in allowed_fields:
                if field in data:
                    update_fields.append(f"{field} = ?")
                    values.append(data[field])
            
            if not update_fields:
                return {
                    'success': False,
                    'error': 'No valid fields to update'
                }
            
            # Add updated_at timestamp
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(supplier_id)
            
            query = f"UPDATE Suppliers SET {', '.join(update_fields)} WHERE supplier_id = ?"
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, values)
                conn.commit()
                
                # Return updated supplier
                return self.get_supplier_by_id(supplier_id)
                
        except Exception as e:
            logger.error(f"Error updating supplier: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def deactivate_supplier(self, supplier_id: int) -> Dict[str, Any]:
        """
        Deactivate supplier (soft delete).
        
        Args:
            supplier_id (int): Supplier ID
            
        Returns:
            Dict[str, Any]: Response
        """
        try:
            query = "UPDATE Suppliers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE supplier_id = ?"
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, (supplier_id,))
                conn.commit()
                
                if cursor.rowcount > 0:
                    return {
                        'success': True,
                        'message': 'Supplier deactivated successfully'
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Supplier not found'
                    }
                    
        except Exception as e:
            logger.error(f"Error deactivating supplier: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_supplier_statistics(self, supplier_id: int) -> Dict[str, Any]:
        """
        Get supplier statistics and metrics.
        
        Args:
            supplier_id (int): Supplier ID
            
        Returns:
            Dict[str, Any]: Response with supplier statistics
        """
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get purchase statistics
                purchase_query = """
                    SELECT 
                        COUNT(*) as total_purchases,
                        COALESCE(SUM(total_amount), 0) as total_spent,
                        COALESCE(AVG(total_amount), 0) as average_order_value,
                        MAX(purchase_date) as last_purchase_date
                    FROM Purchase_Invoice 
                    WHERE supplier_id = ?
                """
                cursor.execute(purchase_query, (supplier_id,))
                purchase_stats = cursor.fetchone()
                
                # Get medicines supplied count
                medicines_query = """
                    SELECT COUNT(DISTINCT medicine_id) as total_medicines_supplied
                    FROM Medicine_Suppliers 
                    WHERE supplier_id = ?
                """
                cursor.execute(medicines_query, (supplier_id,))
                medicines_count = cursor.fetchone()[0]
                
                # Calculate delivery performance score (simplified)
                # This would need more complex logic based on actual delivery data
                delivery_performance_score = 85.0  # Placeholder
                
                stats = {
                    'total_purchases': purchase_stats[0] or 0,
                    'total_spent': float(purchase_stats[1] or 0),
                    'average_order_value': float(purchase_stats[2] or 0),
                    'last_purchase_date': purchase_stats[3],
                    'total_medicines_supplied': medicines_count,
                    'delivery_performance_score': delivery_performance_score
                }
                
                return {
                    'success': True,
                    'data': stats
                }
                
        except Exception as e:
            logger.error(f"Error getting supplier statistics: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_supplier_purchase_history(self, supplier_id: int, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        """
        Get supplier purchase history.
        
        Args:
            supplier_id (int): Supplier ID
            page (int): Page number
            limit (int): Records per page
            
        Returns:
            Dict[str, Any]: Response with purchase history
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
                
                # Get purchase history
                cursor.execute(query, (supplier_id, limit, offset))
                purchases = cursor.fetchall()
                
                purchases_list = []
                for purchase in purchases:
                    purchases_list.append({
                        'purchase_invoice_id': purchase[0],
                        'invoice_number': purchase[1],
                        'purchase_date': purchase[2],
                        'total_amount': float(purchase[3]),
                        'payment_status': purchase[4],
                        'created_at': purchase[5]
                    })
                
                return {
                    'success': True,
                    'data': purchases_list,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting supplier purchase history: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }
    
    def get_supplier_medicines(self, supplier_id: int) -> Dict[str, Any]:
        """
        Get medicines supplied by this supplier.
        
        Args:
            supplier_id (int): Supplier ID
            
        Returns:
            Dict[str, Any]: Response with supplied medicines
        """
        try:
            query = """
                SELECT 
                    m.medicine_id, m.medicine_name, m.generic_name, m.brand,
                    m.category, ms.default_purchase_price, ms.gst_percentage,
                    COALESCE(i.quantity_in_stock, 0) as quantity_in_stock
                FROM Medicine_Suppliers ms
                JOIN Medicines m ON ms.medicine_id = m.medicine_id
                LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id AND i.supplier_id = ms.supplier_id
                WHERE ms.supplier_id = ? AND ms.is_active = 1
                ORDER BY m.medicine_name
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, (supplier_id,))
                medicines = cursor.fetchall()
                
                medicines_list = []
                for medicine in medicines:
                    medicines_list.append({
                        'medicine_id': medicine[0],
                        'medicine_name': medicine[1],
                        'generic_name': medicine[2],
                        'brand': medicine[3],
                        'category': medicine[4],
                        'default_purchase_price': float(medicine[5] or 0),
                        'gst_percentage': float(medicine[6] or 0),
                        'quantity_in_stock': medicine[7]
                    })
                
                return {
                    'success': True,
                    'data': medicines_list
                }
                
        except Exception as e:
            logger.error(f"Error getting supplier medicines: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }
    
    def get_supplier_pending_orders(self, supplier_id: int) -> Dict[str, Any]:
        """
        Get pending purchase orders for supplier.
        
        Args:
            supplier_id (int): Supplier ID
            
        Returns:
            Dict[str, Any]: Response with pending orders
        """
        try:
            query = """
                SELECT 
                    pi.purchase_invoice_id, pi.invoice_number, pi.purchase_date,
                    pi.total_amount, pi.created_at
                FROM Purchase_Invoice pi
                WHERE pi.supplier_id = ? AND pi.payment_status = 'pending'
                ORDER BY pi.purchase_date DESC
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, (supplier_id,))
                orders = cursor.fetchall()
                
                orders_list = []
                for order in orders:
                    orders_list.append({
                        'purchase_invoice_id': order[0],
                        'invoice_number': order[1],
                        'purchase_date': order[2],
                        'total_amount': float(order[3]),
                        'created_at': order[4]
                    })
                
                return {
                    'success': True,
                    'data': orders_list
                }
                
        except Exception as e:
            logger.error(f"Error getting supplier pending orders: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }


# Global supplier service instance
supplier_service = SupplierService()