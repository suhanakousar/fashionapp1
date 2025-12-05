#!/usr/bin/env python3
"""
Start script that runs both FastAPI and Celery worker in the same process
"""
import os
import subprocess
import sys
import signal
import time

def signal_handler(sig, frame):
    """Handle shutdown signals"""
    print("\nShutting down...")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Start Celery worker in background
print("Starting Celery worker...")
celery_process = subprocess.Popen(
    ["celery", "-A", "worker.tasks", "worker", "--loglevel=info", "--concurrency=1"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

# Wait a bit for Celery to start
time.sleep(2)

# Start FastAPI
print("Starting FastAPI server...")
port = os.getenv("PORT", "8000")
uvicorn_process = subprocess.Popen(
    ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", port]
)

# Wait for processes
try:
    uvicorn_process.wait()
except KeyboardInterrupt:
    pass
finally:
    celery_process.terminate()
    uvicorn_process.terminate()
    celery_process.wait()
    uvicorn_process.wait()

