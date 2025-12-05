FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (including git for segment-anything if needed)
RUN apt-get update && apt-get install -y \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    git \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy all backend code (including worker)
COPY . /app

# Make start script executable
RUN chmod +x /app/start.py

# Expose port
EXPOSE 8000

# Run both FastAPI and Celery worker
CMD ["python", "start.py"]

