"""
Main routes module for the Seasonal Medicine Recommendation System.
This module imports and registers all route blueprints.
"""

from flask import Blueprint

# Import all route blueprints
from .upload import upload_bp
from .analysis import analysis_bp
from .results import results_bp
from .inventory import inventory_bp
from .sandbox import sandbox_bp
from .billing import billing_bp
from .returns import returns_bp
from .customers import customers_bp
from .suppliers import suppliers_bp
from .manufacturers import manufacturers_bp
from .purchase_orders import purchase_orders_bp
from .dashboard import dashboard_bp

# Create main API blueprint (no prefix since individual blueprints have their own)
api_bp = Blueprint('api', __name__)

# Register all route blueprints
api_bp.register_blueprint(upload_bp)
api_bp.register_blueprint(analysis_bp)
api_bp.register_blueprint(results_bp)
api_bp.register_blueprint(inventory_bp)
api_bp.register_blueprint(sandbox_bp)
api_bp.register_blueprint(billing_bp)
api_bp.register_blueprint(returns_bp)
api_bp.register_blueprint(customers_bp)
api_bp.register_blueprint(suppliers_bp)
api_bp.register_blueprint(manufacturers_bp)
api_bp.register_blueprint(purchase_orders_bp)
api_bp.register_blueprint(dashboard_bp)