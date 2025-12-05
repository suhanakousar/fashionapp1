#!/bin/bash
echo "Starting StyleWeave Backend..."
echo

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "Please edit .env with your credentials!"
    read -p "Press enter to continue..."
fi

# Start MongoDB (if not running)
echo "Checking MongoDB..."
if ! docker ps | grep -q mongo; then
    echo "Starting MongoDB container..."
    docker run -d -p 27017:27017 --name styleweave_mongo mongo:6
fi

# Start Redis (if not running)
echo "Checking Redis..."
if ! docker ps | grep -q redis; then
    echo "Starting Redis container..."
    docker run -d -p 6379:6379 --name styleweave_redis redis:7-alpine
fi

# Start API
echo
echo "Starting FastAPI server..."
cd vercel-deploy/api
python -m uvicorn app:app --reload --port 8000

