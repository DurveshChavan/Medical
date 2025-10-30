"""
Flask application entry point for the Seasonal Medicine Recommendation System.
Registers all routes, initializes the database, and starts the server.
"""

import os
import logging
from datetime import datetime
from flask import Flask, render_template, send_from_directory
from flask_cors import CORS

from config import FLASK_CONFIG, OUTPUT_DIR, INPUT_DIR
from models.database import init_database, get_database_status
from models import initialize_database_schema, get_database_schema_info
from routes.routes import api_bp
from utils.utils import Logger

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_app():
    """
    Create and configure Flask application.
    
    Returns:
        Flask: Configured Flask application
    """
    app = Flask(__name__)
    
    # Configure Flask
    app.config.update(FLASK_CONFIG)
    
    # Enable CORS for frontend integration
    CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'])
    
    # Register blueprints
    app.register_blueprint(api_bp)
    
    # Create necessary directories
    OUTPUT_DIR.mkdir(exist_ok=True)
    INPUT_DIR.mkdir(exist_ok=True)
    
    return app


def initialize_application():
    """
    Initialize application components.
    
    Returns:
        bool: True if initialization successful, False otherwise
    """
    Logger.log_analysis_start("Application Initialization", {})
    
    try:
        # Initialize database connection
        if not init_database():
            logger.error("Failed to initialize database connection")
            return False
        
        # Initialize database schema (skip if tables already exist)
        try:
            initialize_database_schema()
            logger.info("Database schema initialization attempted")
        except Exception as schema_error:
            logger.warning(f"Schema initialization skipped: {schema_error}")
            # Continue anyway if database already has tables
        
        # Get database status
        db_status = get_database_status()
        schema_info = get_database_schema_info()
        
        logger.info("Application initialization completed successfully")
        logger.info(f"Database status: {db_status}")
        logger.info(f"Schema info: {schema_info}")
        
        Logger.log_analysis_complete("Application Initialization", {
            "database_connected": db_status.get('connection_test', False),
            "schema_initialized": schema_info.get('schema_exists', False),
            "tables_count": len(schema_info.get('table_info', {}))
        })
        
        return True
        
    except Exception as e:
        Logger.log_error(e, "Application Initialization")
        return False


def create_frontend_routes(app):
    """
    Create frontend routes for serving the React application.
    
    Args:
        app (Flask): Flask application instance
    """
    
    @app.route('/')
    def index():
        """Backend API info page (frontend is served separately on port 3000)."""
        return {
            'message': 'Seasonal Medicine Recommendation System API',
            'version': '1.0.2',
            'status': 'running',
            'frontend_url': 'http://localhost:3000',
            'api_endpoints': {
                'status': '/api/status',
                'dashboard': '/api/dashboard',
                'seasonal': '/api/seasonal',
                'inventory': '/api/inventory',
                'upload': '/api/upload'
            }
        }
    
    @app.route('/static/<path:filename>')
    def serve_static(filename):
        """Serve static files."""
        return send_from_directory('static', filename)
    
    @app.route('/api/status')
    def api_status():
        """API status endpoint."""
        return {
            'status': 'running',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.2',
            'database': get_database_status()
        }


def run_development_server():
    """
    Run the Flask development server.
    """
    app = create_app()
    
    # Initialize application
    if not initialize_application():
        logger.error("Application initialization failed. Exiting.")
        return False
    
    # Create frontend routes
    create_frontend_routes(app)
    
    # Add error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found', 'message': 'The requested resource was not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error', 'message': 'An internal error occurred'}, 500
    
    # Start server
    logger.info(f"Starting Flask server on {FLASK_CONFIG['host']}:{FLASK_CONFIG['port']}")
    logger.info(f"Debug mode: {FLASK_CONFIG['debug']}")
    logger.info(f"Upload folder: {FLASK_CONFIG['upload_folder']}")
    
    try:
        app.run(
            host=FLASK_CONFIG['host'],
            port=FLASK_CONFIG['port'],
            debug=FLASK_CONFIG['debug']
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        return False
    
    return True


def get_application_info():
    """
    Get comprehensive application information.
    
    Returns:
        Dict[str, Any]: Application information
    """
    try:
        db_status = get_database_status()
        schema_info = get_database_schema_info()
        
        return {
            'application': {
                'name': 'Seasonal Medicine Recommendation System',
                'version': '1.0.2',
                'status': 'running',
                'started_at': datetime.now().isoformat()
            },
            'database': db_status,
            'schema': schema_info,
            'directories': {
                'input': str(INPUT_DIR),
                'output': str(OUTPUT_DIR),
                'upload_folder': FLASK_CONFIG['upload_folder']
            },
            'configuration': {
                'host': FLASK_CONFIG['host'],
                'port': FLASK_CONFIG['port'],
                'debug': FLASK_CONFIG['debug'],
                'max_file_size_mb': FLASK_CONFIG['max_content_length'] / (1024 * 1024)
            }
        }
    except Exception as e:
        Logger.log_error(e, "Application Info")
        return {
            'application': {
                'name': 'Seasonal Medicine Recommendation System',
                'version': '1.0.2',
                'status': 'error',
                'error': str(e)
            }
        }


if __name__ == '__main__':
    """
    Main entry point for running the Flask application.
    """
    print("="*80)
    print("SEASONAL MEDICINE RECOMMENDATION SYSTEM")
    print("Flask Backend Server")
    print("="*80)
    print(f"Starting server at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    # Get application info
    app_info = get_application_info()
    print(f"Application: {app_info['application']['name']} v{app_info['application']['version']}")
    print(f"Database: {'Connected' if app_info['database'].get('connection_test') else 'Disconnected'}")
    print(f"Schema: {'Initialized' if app_info['schema'].get('schema_exists') else 'Not initialized'}")
    print(f"Input Directory: {app_info['directories']['input']}")
    print(f"Output Directory: {app_info['directories']['output']}")
    print("="*80)
    
    # Run server
    success = run_development_server()
    
    if success:
        print("Server started successfully")
    else:
        print("Failed to start server")
        exit(1)
