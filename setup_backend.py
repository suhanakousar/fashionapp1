#!/usr/bin/env python3
"""
Quick setup script for StyleWeave backend
"""
import os
import subprocess
import sys

def run_command(cmd, cwd=None):
    """Run a shell command"""
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    print(result.stdout)
    return True

def main():
    print("🚀 StyleWeave Backend Setup\n")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required")
        return
    
    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor} detected\n")
    
    # Setup API
    print("📦 Installing API dependencies...")
    if not run_command(f"{sys.executable} -m pip install -r requirements.txt", cwd="vercel-deploy/api"):
        print("❌ Failed to install API dependencies")
        return
    print("✓ API dependencies installed\n")
    
    # Setup Worker (optional - requires GPU for full functionality)
    print("📦 Installing Worker dependencies...")
    print("⚠️  Note: Worker requires GPU and SAM checkpoint for full functionality")
    if not run_command(f"{sys.executable} -m pip install -r requirements.txt", cwd="worker-deploy/worker"):
        print("⚠️  Worker dependencies installation had issues (this is OK for preview-only mode)")
    else:
        print("✓ Worker dependencies installed\n")
    
    # Check .env file
    if not os.path.exists(".env"):
        print("⚠️  .env file not found. Creating from template...")
        if os.path.exists(".env.example"):
            run_command("copy .env.example .env" if os.name == "nt" else "cp .env.example .env")
            print("✓ Created .env file - please edit it with your credentials\n")
        else:
            print("❌ .env.example not found")
    
    print("✅ Setup complete!\n")
    print("Next steps:")
    print("1. Edit .env with your Cloudinary, MongoDB, and Redis credentials")
    print("2. Start MongoDB and Redis (or use Docker)")
    print("3. Run: cd vercel-deploy/api && uvicorn app:app --reload")
    print("4. Visit: http://localhost:8000/docs")

if __name__ == "__main__":
    main()

