FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY api/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy API code
COPY api /app/api

# Expose port
EXPOSE 8000

# Run uvicorn - import from api.app
CMD ["uvicorn", "api.app:app", "--host", "0.0.0.0", "--port", "8000"]

