#!/usr/bin/env python3
"""
Backend startup script that ensures virtual environment is activated.
This script can be run from anywhere and will automatically:
1. Find the project directory
2. Activate the virtual environment
3. Run the Flask backend
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def find_project_root():
    """Find the project root directory containing .venv"""
    current_dir = Path(__file__).parent.absolute()
    
    # Look for .venv directory in current and parent directories
    for path in [current_dir] + list(current_dir.parents):
        if (path / ".venv").exists():
            return path
    
    raise FileNotFoundError("Could not find .venv directory. Please ensure you're in the project directory.")

def activate_venv_and_run():
    """Activate virtual environment and run the backend"""
    try:
        # Find project root
        project_root = find_project_root()
        print(f"Project root: {project_root}")
        
        # Change to project root
        os.chdir(project_root)
        
        # Determine the correct activation script based on OS
        if platform.system() == "Windows":
            activate_script = project_root / ".venv" / "Scripts" / "activate.bat"
            python_exe = project_root / ".venv" / "Scripts" / "python.exe"
        else:
            activate_script = project_root / ".venv" / "bin" / "activate"
            python_exe = project_root / ".venv" / "bin" / "python"
        
        # Check if virtual environment exists
        if not python_exe.exists():
            print("ERROR: Virtual environment not found!")
            print("Please run: python -m venv .venv")
            return False
        
        # Change to backend directory
        backend_dir = project_root / "backend"
        if not backend_dir.exists():
            print("ERROR: Backend directory not found!")
            return False
        
        os.chdir(backend_dir)
        
        # Run the Flask application using the virtual environment Python
        print("Starting Flask backend server...")
        print("=" * 50)
        
        if platform.system() == "Windows":
            # On Windows, use the batch file approach
            subprocess.run([str(python_exe), "app.py"], check=True)
        else:
            # On Unix-like systems, use the Python executable directly
            subprocess.run([str(python_exe), "app.py"], check=True)
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"ERROR: Backend server failed to start! Exit code: {e.returncode}")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("SEASONAL MEDICINE RECOMMENDATION SYSTEM")
    print("Backend Server Startup Script")
    print("=" * 50)
    
    success = activate_venv_and_run()
    
    if not success:
        input("Press Enter to exit...")
        sys.exit(1)


