# StyleWeave Backend Setup Guide

## Quick Setup Steps

### 1. Clone and Navigate
```bash
cd styleweave
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Download SAM Checkpoint
```bash
mkdir -p weights
cd weights

# Download SAM checkpoint (choose one):
# Option 1: High quality (2.4GB)
wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth -O sam_vit_h.pth

# Option 2: Balanced (1.2GB)
wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth -O sam_vit_l.pth

# Option 3: Fast (375MB)
wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth -O sam_vit_b.pth
```

### 4. Run with Docker

**GPU Mode:**
```bash
cd docker
docker-compose up --build
```

**CPU Mode:**
```bash
cd docker
docker-compose -f docker-compose.cpu.yml up --build
```

### 5. Verify Installation

```bash
# Check API
curl http://localhost:8000/health

# Check API docs
open http://localhost:8000/docs
```

## Manual Setup (Without Docker)

### Prerequisites
- Python 3.11+
- MongoDB
- Redis
- CUDA (for GPU worker)

### Install Dependencies

**API:**
```bash
cd vercel-deploy/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Worker:**
```bash
cd worker-deploy/worker
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install git+https://github.com/facebookresearch/segment-anything.git
```

### Run Services

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - Redis:**
```bash
redis-server
```

**Terminal 3 - API:**
```bash
cd vercel-deploy/api
source venv/bin/activate
uvicorn app:app --reload
```

**Terminal 4 - Worker:**
```bash
cd worker-deploy/worker
source venv/bin/activate
celery -A tasks worker --loglevel=info
```

## Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v

# Run only unit tests
pytest tests/ -v -m "not integration"
```

## Troubleshooting

### Import Errors
If you see import errors, ensure:
1. Python path includes project root
2. All dependencies are installed
3. Virtual environment is activated

### SAM Not Found
- Ensure checkpoint is in `/weights/` directory
- Check `SAM_CHECKPOINT` in `.env` matches actual path

### GPU Issues
- Verify CUDA is installed: `nvidia-smi`
- Check `CUDA_VISIBLE_DEVICES` in `.env`
- Use CPU mode for testing without GPU

### MongoDB Connection
- Verify MongoDB is running: `mongosh`
- Check `MONGO_URI` in `.env`
- Default: `mongodb://localhost:27017/styleweave`

### Redis Connection
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `.env`
- Default: `redis://localhost:6379/0`

