"""
Upload and file management routes for the Seasonal Medicine Recommendation System.
Handles CSV file uploads, validation, and file management operations.
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

from config import INPUT_DIR, OUTPUT_DIR, CSV_REQUIRED_COLUMNS, VALIDATION_RULES
from utils.utils import FileValidator, Logger, FileManager, safe_filename

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
upload_bp = Blueprint('upload', __name__, url_prefix='/api')

# Global variables for analysis status
analysis_status = {
    'is_running': False,
    'progress': 0,
    'current_step': '',
    'results': None,
    'error': None,
    'started_at': None,
    'completed_at': None
}


@upload_bp.route('/upload_csv', methods=['POST'])
def upload_csv():
    """
    Handle CSV file upload and save to /input directory.
    
    Returns:
        Dict[str, Any]: Upload results
    """
    Logger.log_analysis_start("CSV Upload", {"files": len(request.files)})
    
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided',
                'message': 'Please select a CSV file to upload'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected',
                'message': 'Please select a file'
            }), 400
        
        if not file.filename.lower().endswith('.csv'):
            return jsonify({
                'success': False,
                'error': 'Invalid file type',
                'message': 'Please upload a CSV file'
            }), 400
        
        # Secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{filename}"
        
        # Save file
        file_path = INPUT_DIR / filename
        file.save(str(file_path))
        
        # Validate file
        validator = FileValidator()
        validation_result = validator.validate_csv_file(file_path)
        
        if not validation_result['is_valid']:
            # Remove invalid file
            file_path.unlink()
            return jsonify({
                'success': False,
                'error': 'File validation failed',
                'validation_errors': validation_result['errors'],
                'warnings': validation_result['warnings']
            }), 400
        
        # Get file info
        file_size = file_path.stat().st_size
        file_hash = validator.get_file_hash(file_path)
        
        Logger.log_analysis_complete("CSV Upload", {
            "filename": filename,
            "size_bytes": file_size,
            "validation_passed": True
        })
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'filename': filename,
            'file_path': str(file_path),
            'file_size_bytes': file_size,
            'file_size_mb': round(file_size / (1024 * 1024), 2),
            'file_hash': file_hash,
            'validation': {
                'passed': True,
                'warnings': validation_result['warnings']
            }
        })
        
    except Exception as e:
        Logger.log_error(e, "CSV Upload")
        return jsonify({
            'success': False,
            'error': 'Upload failed',
            'message': str(e)
        }), 500


@upload_bp.route('/analyze', methods=['POST'])
def trigger_analysis():
    """
    Trigger data loading and analysis.
    
    Expected JSON payload:
    {
        "csv_filename": "filename.csv",
        "target_season": "Winter",
        "forecast_top_n": 3
    }
    
    Returns:
        Dict[str, Any]: Analysis trigger results
    """
    global analysis_status
    
    try:
        # Check if analysis is already running
        if analysis_status['is_running']:
            return jsonify({
                'success': False,
                'error': 'Analysis already running',
                'message': 'Please wait for the current analysis to complete'
            }), 409
        
        # Get request data
        data = request.get_json() or {}
        csv_filename = data.get('csv_filename')
        target_season = data.get('target_season', 'Winter')
        forecast_top_n = data.get('forecast_top_n', 3)
        
        if not csv_filename:
            return jsonify({
                'success': False,
                'error': 'Missing CSV filename',
                'message': 'Please provide csv_filename in request body'
            }), 400
        
        # Validate target season
        valid_seasons = ['Summer', 'Monsoon', 'Winter']
        if target_season not in valid_seasons:
            return jsonify({
                'success': False,
                'error': 'Invalid target season',
                'message': f'Target season must be one of: {valid_seasons}'
            }), 400
        
        # Check if CSV file exists
        csv_path = INPUT_DIR / csv_filename
        if not csv_path.exists():
            return jsonify({
                'success': False,
                'error': 'CSV file not found',
                'message': f'File {csv_filename} not found in input directory'
            }), 404
        
        # Initialize analysis status
        analysis_status.update({
            'is_running': True,
            'progress': 0,
            'current_step': 'Initializing',
            'results': None,
            'error': None,
            'started_at': datetime.now().isoformat(),
            'completed_at': None
        })
        
        Logger.log_analysis_start("Analysis Trigger", {
            "csv_filename": csv_filename,
            "target_season": target_season,
            "forecast_top_n": forecast_top_n
        })
        
        # Initialize database schema if needed
        from models import initialize_database_schema
        analysis_status['current_step'] = 'Initializing database'
        analysis_status['progress'] = 10
        if not initialize_database_schema():
            analysis_status.update({
                'is_running': False,
                'error': 'Database initialization failed',
                'completed_at': datetime.now().isoformat()
            })
            return jsonify({
                'success': False,
                'error': 'Database initialization failed',
                'message': 'Could not initialize database schema'
            }), 500
        
        # Load CSV data
        from utils.data_loader import load_csv_data
        analysis_status['current_step'] = 'Loading CSV data'
        analysis_status['progress'] = 30
        loading_results = load_csv_data(csv_path)
        
        if not loading_results['success']:
            analysis_status.update({
                'is_running': False,
                'error': 'Data loading failed',
                'completed_at': datetime.now().isoformat()
            })
            return jsonify({
                'success': False,
                'error': 'Data loading failed',
                'message': 'Could not load CSV data into database',
                'loading_errors': loading_results.get('errors', [])
            }), 500
        
        # Run analysis
        from utils.analyzer import run_analysis
        analysis_status['current_step'] = 'Running analysis'
        analysis_status['progress'] = 60
        analysis_results = run_analysis(target_season, forecast_top_n)
        
        if not analysis_results['success']:
            analysis_status.update({
                'is_running': False,
                'error': 'Analysis failed',
                'completed_at': datetime.now().isoformat()
            })
            return jsonify({
                'success': False,
                'error': 'Analysis failed',
                'message': 'Could not complete analysis',
                'analysis_errors': analysis_results.get('errors', [])
            }), 500
        
        # Save results
        analysis_status['current_step'] = 'Saving results'
        analysis_status['progress'] = 90
        
        # Generate output files
        output_files = generate_output_files(analysis_results, target_season)
        
        # Update analysis status
        analysis_status.update({
            'is_running': False,
            'progress': 100,
            'current_step': 'Completed',
            'results': analysis_results,
            'error': None,
            'completed_at': datetime.now().isoformat()
        })
        
        Logger.log_analysis_complete("Analysis Trigger", {
            "success": True,
            "output_files": len(output_files)
        })
        
        return jsonify({
            'success': True,
            'message': 'Analysis completed successfully',
            'analysis_id': f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'target_season': target_season,
            'results_summary': {
                'recommendations_count': analysis_results.get('recommendations', {}).get('total_medicines', 0),
                'fast_movers': analysis_results.get('recommendations', {}).get('fast_movers', 0),
                'forecasts_generated': len(analysis_results.get('forecasts', {}))
            },
            'output_files': output_files,
            'completed_at': analysis_status['completed_at']
        })
        
    except Exception as e:
        Logger.log_error(e, "Analysis Trigger")
        analysis_status.update({
            'is_running': False,
            'error': str(e),
            'completed_at': datetime.now().isoformat()
        })
        return jsonify({
            'success': False,
            'error': 'Analysis trigger failed',
            'message': str(e)
        }), 500


def generate_output_files(analysis_results: Dict[str, Any], target_season: str) -> List[Dict[str, str]]:
    """
    Generate output files from analysis results.
    
    Args:
        analysis_results (Dict[str, Any]): Analysis results
        target_season (str): Target season
        
    Returns:
        List[Dict[str, str]]: List of generated files
    """
    from config import OUTPUT_PATTERNS
    
    output_files = []
    
    try:
        # Save recommendations as JSON
        if 'recommendations' in analysis_results:
            json_file = FileManager.save_json(
                analysis_results['recommendations'],
                OUTPUT_PATTERNS['recommendations_json'].format(season=target_season.lower())
            )
            output_files.append({
                'type': 'recommendations_json',
                'file_path': str(json_file),
                'file_name': json_file.name
            })
        
        # Save seasonal analysis as JSON
        if 'seasonal_analysis' in analysis_results:
            seasonal_file = FileManager.save_json(
                analysis_results['seasonal_analysis'],
                f'seasonal_analysis_{target_season.lower()}.json'
            )
            output_files.append({
                'type': 'seasonal_analysis',
                'file_path': str(seasonal_file),
                'file_name': seasonal_file.name
            })
        
        # Save forecasts as JSON
        if 'forecasts' in analysis_results and analysis_results['forecasts']:
            forecasts_file = FileManager.save_json(
                analysis_results['forecasts'],
                f'forecasts_{target_season.lower()}.json'
            )
            output_files.append({
                'type': 'forecasts',
                'file_path': str(forecasts_file),
                'file_name': forecasts_file.name
            })
        
        logger.info(f"Generated {len(output_files)} output files")
        
    except Exception as e:
        Logger.log_error(e, "Output File Generation")
    
    return output_files
