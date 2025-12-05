# GPU-enabled worker (for CUDA)
# For CPU-only, use: FROM python:3.11-slim and remove CUDA-specific parts
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    ffmpeg \
    libsm6 \
    libxrender1 \
    libxext6 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /worker

# Copy requirements and install Python dependencies
COPY worker/requirements.txt /worker/requirements.txt
RUN pip3 install --no-cache-dir -r /worker/requirements.txt

# Install segment-anything (if needed)
# RUN pip3 install git+https://github.com/facebookresearch/segment-anything.git

# Copy worker code
COPY worker /worker

# Set working directory for Celery
WORKDIR /worker

# Run Celery worker
CMD ["celery", "-A", "tasks", "worker", "--loglevel=info", "--concurrency=1"]

