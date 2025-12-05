#!/bin/bash
# Start script that runs both FastAPI and Celery worker

# Start Celery worker in background
celery -A worker.tasks worker --loglevel=info --concurrency=1 &

# Start FastAPI
uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}

