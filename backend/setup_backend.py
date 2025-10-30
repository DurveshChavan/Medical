"""
Backend Setup Script
Helps set up the backend environment and fix common issues.
"""

import sys
import subprocess
import os

def run_command(cmd):
    """Run a shell command and return the result."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_python_version():
    """Check if Python version is compatible."""
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("[ERROR] Python 3.8 or higher is required")
        return False
    
    print("[OK] Python version is compatible")
    return True

def install_dependencies():
    """Install dependencies from requirements.txt."""
    print("\n📦 Installing dependencies...")
    
    # Upgrade pip first
    print("Upgrading pip...")
    success, stdout, stderr = run_command(f"{sys.executable} -m pip install --upgrade pip")
    
    if not success:
        print(f"⚠️  Warning: Could not upgrade pip: {stderr}")
    
    # Install requirements
    print("Installing packages from requirements.txt...")
    success, stdout, stderr = run_command(f"{sys.executable} -m pip install -r requirements.txt")
    
    if success:
        print("✅ Dependencies installed successfully")
        return True
    else:
        print(f"❌ Failed to install dependencies: {stderr}")
        return False

def check_database():
    """Check if database directory exists."""
    db_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database')
    
    if os.path.exists(db_dir):
        print(f"✅ Database directory exists: {db_dir}")
        
        # List database files
        db_files = [f for f in os.listdir(db_dir) if f.endswith('.db')]
        if db_files:
            print(f"   Found database files: {', '.join(db_files)}")
        else:
            print("   ⚠️  No database files found. You may need to create the database.")
    else:
        print(f"⚠️  Database directory not found. Creating: {db_dir}")
        os.makedirs(db_dir, exist_ok=True)

def main():
    """Main setup function."""
    print("=" * 80)
    print("BACKEND SETUP - Seasonal Medicine Recommendation System")
    print("=" * 80)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("\n⚠️  Some dependencies failed to install.")
        print("You may need to install them manually:")
        print(f"  {sys.executable} -m pip install -r requirements.txt")
    
    # Check database
    check_database()
    
    print("\n" + "=" * 80)
    print("✅ SETUP COMPLETE!")
    print("=" * 80)
    print("\nNext steps:")
    print("1. Activate your virtual environment (if using one)")
    print("2. Run: python app.py")
    print("3. Backend will be available at: http://localhost:5000")
    print("\nIf you encounter import errors, try:")
    print(f"  {sys.executable} -m pip install --upgrade numpy statsmodels --force-reinstall")

if __name__ == "__main__":
    main()

