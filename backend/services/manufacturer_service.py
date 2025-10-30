"""
Manufacturer Service
====================
Handles all manufacturer-related business logic and database operations.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date
from models.database import get_database_manager

logger = logging.getLogger(__name__)


class ManufacturerService:
    """Service class for manufacturer operations."""
    
    def __init__(self):
        self.db_manager = get_database_manager()
    
    def get_all_manufacturers(self, page: int = 1, limit: int = 50, active_only: bool = True) -> Dict[str, Any]:
        """
        Get all manufacturers with pagination.
        
        Args:
            page (int): Page number (1-based)
            limit (int): Number of records per page
            active_only (bool): If True, only return active manufacturers
            
        Returns:
            Dict[str, Any]: Response with manufacturers data and pagination info
        """
        try:
            offset = (page - 1) * limit
            
            # Build query
            where_clause = "WHERE is_active = 1" if active_only else ""
            count_query = f"SELECT COUNT(*) FROM Manufacturers {where_clause}"
            
            query = f"""
                SELECT 
                    manufacturer_id, manufacturer_name, contact_person, email, phone,
                    address, city, state, zip_code, country, is_active, created_at, updated_at
                FROM Manufacturers 
                {where_clause}
                ORDER BY manufacturer_name
                LIMIT ? OFFSET ?
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get total count
                cursor.execute(count_query)
                total_count = cursor.fetchone()[0]
                
                # Get manufacturers
                cursor.execute(query, (limit, offset))
                manufacturers = cursor.fetchall()
                
                # Convert to list of dicts
                manufacturers_list = []
                for manufacturer in manufacturers:
                    manufacturers_list.append({
                        'manufacturer_id': manufacturer[0],
                        'manufacturer_name': manufacturer[1],
                        'contact_person': manufacturer[2],
                        'email': manufacturer[3],
                        'phone': manufacturer[4],
                        'address': manufacturer[5],
                        'city': manufacturer[6],
                        'state': manufacturer[7],
                        'zip_code': manufacturer[8],
                        'country': manufacturer[9],
                        'is_active': bool(manufacturer[10]),
                        'created_at': manufacturer[11],
                        'updated_at': manufacturer[12]
                    })
                
                return {
                    'success': True,
                    'data': manufacturers_list,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting manufacturers: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }
    
    def search_manufacturers(self, query: str, active_only: bool = True) -> Dict[str, Any]:
        """
        Search manufacturers by name, contact, or email.
        
        Args:
            query (str): Search query
            active_only (bool): If True, only search active manufacturers
            
        Returns:
            Dict[str, Any]: Response with matching manufacturers
        """
        try:
            search_term = f"%{query}%"
            where_clause = "WHERE is_active = 1" if active_only else ""
            
            if where_clause:
                where_clause += " AND "
            else:
                where_clause = "WHERE "
            
            where_clause += """
                (manufacturer_name LIKE ? OR 
                 contact_person LIKE ? OR 
                 email LIKE ?)
            """
            
            query_sql = f"""
                SELECT 
                    manufacturer_id, manufacturer_name, contact_person, email, phone,
                    address, city, state, zip_code, country, is_active, created_at, updated_at
                FROM Manufacturers 
                {where_clause}
                ORDER BY manufacturer_name
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query_sql, (search_term, search_term, search_term))
                manufacturers = cursor.fetchall()
                
                # Convert to list of dicts
                manufacturers_list = []
                for manufacturer in manufacturers:
                    manufacturers_list.append({
                        'manufacturer_id': manufacturer[0],
                        'manufacturer_name': manufacturer[1],
                        'contact_person': manufacturer[2],
                        'email': manufacturer[3],
                        'phone': manufacturer[4],
                        'address': manufacturer[5],
                        'city': manufacturer[6],
                        'state': manufacturer[7],
                        'zip_code': manufacturer[8],
                        'country': manufacturer[9],
                        'is_active': bool(manufacturer[10]),
                        'created_at': manufacturer[11],
                        'updated_at': manufacturer[12]
                    })
                
                return {
                    'success': True,
                    'data': manufacturers_list
                }
                
        except Exception as e:
            logger.error(f"Error searching manufacturers: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }
    
    def get_manufacturer_by_id(self, manufacturer_id: int) -> Dict[str, Any]:
        """
        Get manufacturer details by ID.
        
        Args:
            manufacturer_id (int): Manufacturer ID
            
        Returns:
            Dict[str, Any]: Response with manufacturer details
        """
        try:
            query = """
                SELECT 
                    manufacturer_id, manufacturer_name, contact_person, email, phone,
                    address, city, state, zip_code, country, is_active, created_at, updated_at
                FROM Manufacturers 
                WHERE manufacturer_id = ?
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, (manufacturer_id,))
                manufacturer = cursor.fetchone()
                
                if manufacturer:
                    manufacturer_data = {
                        'manufacturer_id': manufacturer[0],
                        'manufacturer_name': manufacturer[1],
                        'contact_person': manufacturer[2],
                        'email': manufacturer[3],
                        'phone': manufacturer[4],
                        'address': manufacturer[5],
                        'city': manufacturer[6],
                        'state': manufacturer[7],
                        'zip_code': manufacturer[8],
                        'country': manufacturer[9],
                        'is_active': bool(manufacturer[10]),
                        'created_at': manufacturer[11],
                        'updated_at': manufacturer[12]
                    }
                    
                    return {
                        'success': True,
                        'data': manufacturer_data
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Manufacturer not found'
                    }
                    
        except Exception as e:
            logger.error(f"Error getting manufacturer by ID: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_manufacturer(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new manufacturer.
        
        Args:
            data (Dict[str, Any]): Manufacturer data
            
        Returns:
            Dict[str, Any]: Response with created manufacturer
        """
        try:
            required_fields = ['manufacturer_name']
            for field in required_fields:
                if field not in data or not data[field]:
                    return {
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }
            
            query = """
                INSERT INTO Manufacturers (
                    manufacturer_name, contact_person, email, phone, address,
                    city, state, zip_code, country, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, (
                    data['manufacturer_name'],
                    data.get('contact_person'),
                    data.get('email'),
                    data.get('phone'),
                    data.get('address'),
                    data.get('city'),
                    data.get('state'),
                    data.get('zip_code'),
                    data.get('country', 'India'),
                    data.get('is_active', True)
                ))
                
                manufacturer_id = cursor.lastrowid
                conn.commit()
                
                # Return created manufacturer
                return self.get_manufacturer_by_id(manufacturer_id)
                
        except Exception as e:
            logger.error(f"Error creating manufacturer: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_manufacturer(self, manufacturer_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update manufacturer information.
        
        Args:
            manufacturer_id (int): Manufacturer ID
            data (Dict[str, Any]): Updated manufacturer data
            
        Returns:
            Dict[str, Any]: Response with updated manufacturer
        """
        try:
            # Check if manufacturer exists
            existing = self.get_manufacturer_by_id(manufacturer_id)
            if not existing['success']:
                return existing
            
            # Build update query dynamically
            update_fields = []
            values = []
            
            allowed_fields = [
                'manufacturer_name', 'contact_person', 'email', 'phone',
                'address', 'city', 'state', 'zip_code', 'country', 'is_active'
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
            values.append(manufacturer_id)
            
            query = f"UPDATE Manufacturers SET {', '.join(update_fields)} WHERE manufacturer_id = ?"
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, values)
                conn.commit()
                
                # Return updated manufacturer
                return self.get_manufacturer_by_id(manufacturer_id)
                
        except Exception as e:
            logger.error(f"Error updating manufacturer: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def deactivate_manufacturer(self, manufacturer_id: int) -> Dict[str, Any]:
        """
        Deactivate manufacturer (soft delete).
        
        Args:
            manufacturer_id (int): Manufacturer ID
            
        Returns:
            Dict[str, Any]: Response
        """
        try:
            query = "UPDATE Manufacturers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE manufacturer_id = ?"
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, (manufacturer_id,))
                conn.commit()
                
                if cursor.rowcount > 0:
                    return {
                        'success': True,
                        'message': 'Manufacturer deactivated successfully'
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Manufacturer not found'
                    }
                    
        except Exception as e:
            logger.error(f"Error deactivating manufacturer: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_manufacturer_statistics(self, manufacturer_id: int) -> Dict[str, Any]:
        """
        Get manufacturer statistics and metrics.
        
        Args:
            manufacturer_id (int): Manufacturer ID
            
        Returns:
            Dict[str, Any]: Response with manufacturer statistics
        """
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get total medicines produced
                medicines_query = """
                    SELECT COUNT(*) as total_medicines_produced
                    FROM Medicines 
                    WHERE manufacturer_id = ?
                """
                cursor.execute(medicines_query, (manufacturer_id,))
                total_medicines = cursor.fetchone()[0]
                
                # Get active medicines count
                active_medicines_query = """
                    SELECT COUNT(*) as active_medicines_count
                    FROM Medicines 
                    WHERE manufacturer_id = ? AND is_active = 1
                """
                cursor.execute(active_medicines_query, (manufacturer_id,))
                active_medicines = cursor.fetchone()[0]
                
                # Get total inventory value
                inventory_query = """
                    SELECT COALESCE(SUM(i.quantity_in_stock * i.purchase_price_per_unit), 0) as total_inventory_value
                    FROM Medicines m
                    JOIN Inventory i ON m.medicine_id = i.medicine_id
                    WHERE m.manufacturer_id = ?
                """
                cursor.execute(inventory_query, (manufacturer_id,))
                inventory_value = cursor.fetchone()[0]
                
                # Get medicines by category
                category_query = """
                    SELECT m.category, COUNT(*) as count
                    FROM Medicines m
                    WHERE m.manufacturer_id = ?
                    GROUP BY m.category
                    ORDER BY count DESC
                """
                cursor.execute(category_query, (manufacturer_id,))
                categories = cursor.fetchall()
                
                medicines_by_category = {cat[0]: cat[1] for cat in categories}
                
                stats = {
                    'total_medicines_produced': total_medicines,
                    'active_medicines_count': active_medicines,
                    'total_inventory_value': float(inventory_value),
                    'medicines_by_category': medicines_by_category
                }
                
                return {
                    'success': True,
                    'data': stats
                }
                
        except Exception as e:
            logger.error(f"Error getting manufacturer statistics: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_manufacturer_medicines(self, manufacturer_id: int) -> Dict[str, Any]:
        """
        Get all medicines manufactured by this manufacturer.
        
        Args:
            manufacturer_id (int): Manufacturer ID
            
        Returns:
            Dict[str, Any]: Response with manufactured medicines
        """
        try:
            query = """
                SELECT 
                    medicine_id, medicine_name, generic_name, brand, dosage_form,
                    strength, category, prescription_required, is_active, created_at
                FROM Medicines 
                WHERE manufacturer_id = ?
                ORDER BY medicine_name
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, (manufacturer_id,))
                medicines = cursor.fetchall()
                
                medicines_list = []
                for medicine in medicines:
                    medicines_list.append({
                        'medicine_id': medicine[0],
                        'medicine_name': medicine[1],
                        'generic_name': medicine[2],
                        'brand': medicine[3],
                        'dosage_form': medicine[4],
                        'strength': medicine[5],
                        'category': medicine[6],
                        'prescription_required': bool(medicine[7]),
                        'is_active': bool(medicine[8]),
                        'created_at': medicine[9]
                    })
                
                return {
                    'success': True,
                    'data': medicines_list
                }
                
        except Exception as e:
            logger.error(f"Error getting manufacturer medicines: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }
    
    def get_manufacturer_inventory(self, manufacturer_id: int) -> Dict[str, Any]:
        """
        Get inventory levels for manufacturer's medicines.
        
        Args:
            manufacturer_id (int): Manufacturer ID
            
        Returns:
            Dict[str, Any]: Response with inventory levels
        """
        try:
            query = """
                SELECT 
                    m.medicine_id, m.medicine_name, m.generic_name, m.brand,
                    m.category, i.quantity_in_stock, i.purchase_price_per_unit,
                    i.selling_price_per_unit, i.batch_number, i.expiry_date,
                    i.reorder_level, i.last_restocked_date
                FROM Medicines m
                JOIN Inventory i ON m.medicine_id = i.medicine_id
                WHERE m.manufacturer_id = ?
                ORDER BY m.medicine_name
            """
            
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, (manufacturer_id,))
                inventory = cursor.fetchall()
                
                inventory_list = []
                for item in inventory:
                    inventory_list.append({
                        'medicine_id': item[0],
                        'medicine_name': item[1],
                        'generic_name': item[2],
                        'brand': item[3],
                        'category': item[4],
                        'quantity_in_stock': item[5],
                        'purchase_price_per_unit': float(item[6] or 0),
                        'selling_price_per_unit': float(item[7] or 0),
                        'batch_number': item[8],
                        'expiry_date': item[9],
                        'reorder_level': item[10],
                        'last_restocked_date': item[11]
                    })
                
                return {
                    'success': True,
                    'data': inventory_list
                }
                
        except Exception as e:
            logger.error(f"Error getting manufacturer inventory: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }


# Global manufacturer service instance
manufacturer_service = ManufacturerService()