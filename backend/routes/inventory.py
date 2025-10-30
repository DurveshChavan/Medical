"""
Inventory management routes for the Seasonal Medicine Recommendation System.
Handles all inventory-related CRUD operations and data retrieval.
"""

import logging
from datetime import datetime
from typing import Dict, Any
from flask import Blueprint, request, jsonify

from utils.utils import Logger

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
inventory_bp = Blueprint('inventory', __name__, url_prefix='/api')


@inventory_bp.route('/inventory/legacy', methods=['GET'])
def get_inventory_legacy():
    """Get inventory data from database (legacy endpoint)."""
    try:
        from models.database import get_database_manager
        db_manager = get_database_manager()
        with db_manager.get_connection() as conn:
            query = """
            SELECT 
                i.inventory_id,
                m.medicine_name,
                m.generic_name,
                m.brand,
                m.category,
                m.dosage_form,
                m.strength,
                i.batch_number,
                i.expiry_date,
                i.quantity_in_stock,
                i.purchase_price_per_unit,
                i.selling_price_per_unit,
                i.reorder_level,
                i.last_restocked_date,
                s.supplier_name,
                man.manufacturer_name
            FROM Inventory i
            JOIN Medicines m ON i.medicine_id = m.medicine_id
            LEFT JOIN Suppliers s ON i.supplier_id = s.supplier_id
            LEFT JOIN Manufacturers man ON m.manufacturer_id = man.manufacturer_id
            ORDER BY m.medicine_name, i.expiry_date
            """
            
            cursor = conn.cursor()
            cursor.execute(query)
            columns = [description[0] for description in cursor.description]
            rows = cursor.fetchall()
            
            inventory_data = []
            for row in rows:
                inventory_item = dict(zip(columns, row))
                # Convert datetime objects to strings
                if inventory_item.get('expiry_date'):
                    inventory_item['expiry_date'] = inventory_item['expiry_date'].isoformat()
                if inventory_item.get('last_restocked_date'):
                    inventory_item['last_restocked_date'] = inventory_item['last_restocked_date'].isoformat()
                inventory_data.append(inventory_item)
            
            return jsonify({
                'success': True,
                'data': inventory_data,
                'count': len(inventory_data)
            })
            
    except Exception as e:
        Logger.log_error(e, "Inventory data retrieval")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve inventory data',
            'message': str(e)
        }), 500


@inventory_bp.route('/inventory', methods=['GET'])
def get_inventory():
    """Get all inventory data with medicine and supplier information."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get inventory with medicine and supplier details
            cursor.execute("""
                SELECT 
                    i.inventory_id,
                    i.medicine_id,
                    m.medicine_name,
                    m.category,
                    s.supplier_name,
                    i.batch_number,
                    i.expiry_date,
                    i.quantity_in_stock,
                    i.purchase_price_per_unit,
                    i.selling_price_per_unit,
                    i.reorder_level,
                    i.last_restocked_date,
                    i.created_at,
                    i.updated_at,
                    CASE 
                        WHEN i.quantity_in_stock = 0 THEN 'out_of_stock'
                        WHEN i.quantity_in_stock <= i.reorder_level THEN 'low_stock'
                        WHEN i.quantity_in_stock <= i.reorder_level * 2 THEN 'medium_stock'
                        ELSE 'adequate_stock'
                    END as stock_status
                FROM Inventory i
                JOIN Medicines m ON i.medicine_id = m.medicine_id
                JOIN Suppliers s ON i.supplier_id = s.supplier_id
                ORDER BY m.medicine_name, i.expiry_date
            """)
            
            inventory_data = cursor.fetchall()
            
            # Transform data for frontend
            inventory_list = []
            for row in inventory_data:
                inventory_list.append({
                    'inventory_id': row[0],
                    'medicine_id': row[1],
                    'medicine_name': row[2],
                    'category': row[3],
                    'supplier_name': row[4],
                    'batch_number': row[5],
                    'expiry_date': row[6],
                    'quantity_in_stock': row[7],
                    'purchase_price_per_unit': row[8],
                    'selling_price_per_unit': row[9],
                    'reorder_level': row[10],
                    'last_restocked_date': row[11],
                    'created_at': row[12],
                    'updated_at': row[13],
                    'stock_status': row[14]
                })
            
            return jsonify({
                'success': True,
                'data': inventory_list,
                'total_count': len(inventory_list)
            })
            
    except Exception as e:
        Logger.log_error(e, "Inventory data retrieval")
        return jsonify({
            'success': False,
            'error': 'Failed to get inventory data',
            'message': str(e)
        }), 500


@inventory_bp.route('/inventory/<int:inventory_id>', methods=['GET'])
def get_inventory_item(inventory_id):
    """Get specific inventory item details."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    i.inventory_id,
                    i.medicine_id,
                    m.medicine_name,
                    m.category,
                    s.supplier_name,
                    i.batch_number,
                    i.expiry_date,
                    i.quantity_in_stock,
                    i.purchase_price_per_unit,
                    i.selling_price_per_unit,
                    i.reorder_level,
                    i.last_restocked_date
                FROM Inventory i
                JOIN Medicines m ON i.medicine_id = m.medicine_id
                JOIN Suppliers s ON i.supplier_id = s.supplier_id
                WHERE i.inventory_id = ?
            """, (inventory_id,))
            
            row = cursor.fetchone()
            
            if not row:
                return jsonify({
                    'success': False,
                    'error': 'Inventory item not found'
                }), 404
            
            inventory_item = {
                'inventory_id': row[0],
                'medicine_id': row[1],
                'medicine_name': row[2],
                'category': row[3],
                'supplier_name': row[4],
                'batch_number': row[5],
                'expiry_date': row[6],
                'quantity_in_stock': row[7],
                'purchase_price_per_unit': row[8],
                'selling_price_per_unit': row[9],
                'reorder_level': row[10],
                'last_restocked_date': row[11]
            }
            
            return jsonify({
                'success': True,
                'data': inventory_item
            })
            
    except Exception as e:
        Logger.log_error(e, f"Inventory item {inventory_id} retrieval")
        return jsonify({
            'success': False,
            'error': 'Failed to get inventory item',
            'message': str(e)
        }), 500


@inventory_bp.route('/inventory', methods=['POST'])
def add_inventory_item():
    """Add new inventory item."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['medicine_id', 'supplier_id', 'batch_number', 'expiry_date', 
                          'quantity_in_stock', 'purchase_price_per_unit', 'selling_price_per_unit']
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Insert new inventory item
            cursor.execute("""
                INSERT INTO Inventory (
                    medicine_id, supplier_id, batch_number, expiry_date,
                    quantity_in_stock, purchase_price_per_unit, selling_price_per_unit,
                    reorder_level, last_restocked_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data['medicine_id'],
                data['supplier_id'],
                data['batch_number'],
                data['expiry_date'],
                data['quantity_in_stock'],
                data['purchase_price_per_unit'],
                data['selling_price_per_unit'],
                data.get('reorder_level', 10),
                data.get('last_restocked_date', datetime.now().strftime('%Y-%m-%d'))
            ))
            
            inventory_id = cursor.lastrowid
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Inventory item added successfully',
                'inventory_id': inventory_id
            })
            
    except Exception as e:
        Logger.log_error(e, "Add inventory item")
        return jsonify({
            'success': False,
            'error': 'Failed to add inventory item',
            'message': str(e)
        }), 500


@inventory_bp.route('/inventory/<int:inventory_id>', methods=['PUT'])
def update_inventory_item(inventory_id):
    """Update inventory item."""
    try:
        data = request.get_json()
        
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if inventory item exists
            cursor.execute("SELECT inventory_id FROM Inventory WHERE inventory_id = ?", (inventory_id,))
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'error': 'Inventory item not found'
                }), 404
            
            # Update inventory item
            update_fields = []
            update_values = []
            
            for field in ['quantity_in_stock', 'purchase_price_per_unit', 'selling_price_per_unit', 
                         'reorder_level', 'last_restocked_date']:
                if field in data:
                    update_fields.append(f"{field} = ?")
                    update_values.append(data[field])
            
            if update_fields:
                update_values.append(inventory_id)
                cursor.execute(f"""
                    UPDATE Inventory 
                    SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
                    WHERE inventory_id = ?
                """, update_values)
                
                conn.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Inventory item updated successfully'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'No fields to update'
                }), 400
            
    except Exception as e:
        Logger.log_error(e, f"Update inventory item {inventory_id}")
        return jsonify({
            'success': False,
            'error': 'Failed to update inventory item',
            'message': str(e)
        }), 500


@inventory_bp.route('/inventory/<int:inventory_id>', methods=['DELETE'])
def delete_inventory_item(inventory_id):
    """Delete inventory item."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if inventory item exists
            cursor.execute("SELECT inventory_id FROM Inventory WHERE inventory_id = ?", (inventory_id,))
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'error': 'Inventory item not found'
                }), 404
            
            # Delete inventory item
            cursor.execute("DELETE FROM Inventory WHERE inventory_id = ?", (inventory_id,))
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Inventory item deleted successfully'
            })
            
    except Exception as e:
        Logger.log_error(e, f"Delete inventory item {inventory_id}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete inventory item',
            'message': str(e)
        }), 500


@inventory_bp.route('/inventory/medicines', methods=['GET'])
def get_medicines_for_inventory():
    """Get medicines list for inventory management."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT medicine_id, medicine_name, category
                FROM Medicines
                ORDER BY medicine_name
            """)
            
            medicines = []
            for row in cursor.fetchall():
                medicines.append({
                    'medicine_id': row[0],
                    'medicine_name': row[1],
                    'category': row[2]
                })
            
            return jsonify({
                'success': True,
                'data': medicines
            })
            
    except Exception as e:
        Logger.log_error(e, "Medicines list retrieval")
        return jsonify({
            'success': False,
            'error': 'Failed to get medicines list',
            'message': str(e)
        }), 500


@inventory_bp.route('/inventory/suppliers', methods=['GET'])
def get_suppliers_for_inventory():
    """Get suppliers list for inventory management."""
    try:
        from models.database_state import db_state
        active_db_path = db_state.get_active_database_path()
        
        from models.database import DatabaseManager
        db_manager = DatabaseManager(active_db_path)
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT supplier_id, supplier_name, contact_person_name, phone
                FROM Suppliers
                WHERE is_active = 1
                ORDER BY supplier_name
            """)
            
            suppliers = []
            for row in cursor.fetchall():
                suppliers.append({
                    'supplier_id': row[0],
                    'supplier_name': row[1],
                    'contact_person': row[2],
                    'phone': row[3]
                })
            
            return jsonify({
                'success': True,
                'data': suppliers
            })
            
    except Exception as e:
        Logger.log_error(e, "Suppliers list retrieval")
        return jsonify({
            'success': False,
            'error': 'Failed to get suppliers list',
            'message': str(e)
        }), 500
