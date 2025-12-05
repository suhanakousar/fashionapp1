# StyleWeave Backend - Quick Start

## 🚀 Get Running in 5 Minutes

### Step 1: Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials:
# - CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET
# - MONGO_URI (default: mongodb://localhost:27017/styleweave)
# - REDIS_URL (default: redis://localhost:6379/0)
```

### Step 2: Install Dependencies (Local Dev)

**Option A: Using Docker (Recommended)**
```bash
cd docker
docker-compose -f docker-compose.cpu.yml up --build
```

**Option B: Manual Setup**
```bash
# Terminal 1: MongoDB
docker run -d -p 27017:27017 --name mongo mongo:6

# Terminal 2: Redis
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Terminal 3: API
cd vercel-deploy/api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

# Terminal 4: Worker (optional for previews)
cd worker-deploy/worker
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Note: HD rendering requires GPU and SAM checkpoint
celery -A tasks worker --loglevel=info
```

### Step 3: Test the API

```bash
# Health check
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs
```

### Step 4: Upload Your First Image

```bash
# Upload a model image
curl -X POST "http://localhost:8000/v1/upload" \
  -F "file=@your_model_image.jpg" \
  -F "type=model" \
  -F "project_id=test_project"
```

**Response:**
```json
{
  "success": true,
  "upload": {
    "_id": "65f123...",
    "type": "model",
    "cloudinary": {
      "secure_url": "https://res.cloudinary.com/..."
    }
  }
}
```

### Step 5: Generate Masks (Requires SAM)

**Note:** SAM checkpoint must be downloaded first:
```bash
mkdir -p weights
# Download from: https://github.com/facebookresearch/segment-anything#model-checkpoints
wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth -O weights/sam_vit_h.pth
```

Then generate masks:
```bash
curl -X POST "http://localhost:8000/v1/mask/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "upload_id": "YOUR_UPLOAD_ID",
    "auto_refine": true
  }'
```

### Step 6: Apply Preview (Fast, No GPU)

```bash
curl -X POST "http://localhost:8000/v1/outfit/apply_preview" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test_project",
    "model_upload_id": "MODEL_ID",
    "top_fabric_upload_id": "FABRIC_ID",
    "mask_top_id": "MASK_ID",
    "scale": 1.0
  }'
```

## 📋 Common Commands

### Docker Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f worker

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build
```

### Development Commands
```bash
# Run tests
pytest tests/ -v

# Check API health
curl http://localhost:8000/health

# View API documentation
open http://localhost:8000/docs
```

## ⚠️ Important Notes

1. **SAM Checkpoint**: Required for mask generation. Download from [SAM GitHub](https://github.com/facebookresearch/segment-anything#model-checkpoints)

2. **GPU for HD Renders**: HD rendering requires:
   - NVIDIA GPU with CUDA
   - Stable Diffusion model (auto-downloads)
   - ~8GB+ VRAM recommended

3. **Preview Mode**: Works without GPU using OpenCV (fast, CPU-only)

4. **Cloudinary**: Required for image storage. Sign up at [cloudinary.com](https://cloudinary.com)

## 🐛 Troubleshooting

**Import Errors:**
- Ensure Python path includes project root
- Check that worker directory is accessible

**MongoDB Connection:**
```bash
# Test connection
mongosh mongodb://localhost:27017/styleweave
```

**Redis Connection:**
```bash
# Test connection
redis-cli ping
# Should return: PONG
```

**SAM Not Found:**
- Check `SAM_CHECKPOINT` path in `.env`
- Ensure checkpoint file exists at specified path

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- See [SETUP.md](SETUP.md) for detailed setup
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

