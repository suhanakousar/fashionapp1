# StyleWeave AI

Production-ready full-stack application for applying user-provided fabrics to model images using AI segmentation and inpainting.

## 🚀 Quick Deployment

**Ready-to-deploy folders:**
- **`vercel-deploy/`** - Deploy to Vercel (Frontend + API) → See `QUICK_DEPLOY.md`
- **`worker-deploy/`** - Deploy to Railway/Render (ML Worker) → See `worker-deploy/README.md`

For detailed deployment instructions, see:
- `QUICK_DEPLOY.md` - Fastest way to deploy
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `vercel-deploy/README.md` - Vercel-specific guide
- `worker-deploy/README.md` - Worker deployment options

---

## 📖 Local Development

**Note:** Source code is now in deployment folders:
- **API**: `vercel-deploy/api/`
- **Frontend**: `vercel-deploy/src/`
- **Worker**: `worker-deploy/worker/`

This section covers local development. For deployment, see the guides above.

## Features

- **Image Upload**: Upload model photos and fabric images via Cloudinary
- **AI Segmentation**: Automatic mask generation using SAM (Segment Anything Model)
- **Fast Preview**: Classical OpenCV texture application for instant previews
- **HD Rendering**: GPU-accelerated Stable Diffusion inpainting for high-quality results
- **Background Jobs**: Celery-based async processing with Redis
- **MongoDB Storage**: Persistent metadata and job tracking

## Architecture

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  FastAPI│────▶│ MongoDB │     │ Redis   │
│   API   │     │         │     │ (Celery)│
└─────────┘     └─────────┘     └─────────┘
     │                                  │
     │                                  │
     ▼                                  ▼
┌─────────┐                     ┌─────────────┐
│Cloudinary│                     │   Celery    │
│  Storage │                     │   Worker    │
└─────────┘                     └─────────────┘
                                        │
                                        ▼
                                ┌─────────────┐
                                │  SAM / SD   │
                                │  Inference  │
                                └─────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- NVIDIA Docker (for GPU support) - optional
- Cloudinary account
- MongoDB (or use Docker)
- Redis (or use Docker)

### 1. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your:
- Cloudinary credentials
- MongoDB URI
- Redis URL
- Secret keys

### 2. Download Model Checkpoints

**SAM Checkpoint** (required for segmentation):
```bash
# Create weights directory
mkdir -p weights

# Download SAM checkpoint (choose one):
# - sam_vit_h.pth (2.4GB) - Best quality
# - sam_vit_l.pth (1.2GB) - Balanced
# - sam_vit_b.pth (375MB) - Fastest

# Example:
wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth -O weights/sam_vit_h.pth
```

**Stable Diffusion** (auto-downloaded on first use):
- Model: `runwayml/stable-diffusion-inpainting` (default)
- Downloads automatically via HuggingFace

### 3. Run with Docker Compose

**Option A: GPU Mode** (recommended for HD rendering)

```bash
cd docker
docker-compose up --build
```

**Option B: CPU-Only Mode** (for local dev, previews only)

Edit `docker/docker-compose.yml` and change:
```yaml
worker:
  build:
    dockerfile: docker/Dockerfile.worker.cpu  # Use CPU version
```

Then run:
```bash
cd docker
docker-compose up --build
```

### 4. Access API

- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## API Endpoints

### 1. Upload Image

```bash
POST /v1/upload
Content-Type: multipart/form-data

file: <image file>
type: model | top_fabric | bottom_fabric
project_id: <optional>
```

**Response:**
```json
{
  "success": true,
  "upload": {
    "_id": "...",
    "type": "model",
    "cloudinary": {
      "public_id": "...",
      "secure_url": "...",
      "width": 1024,
      "height": 1536
    }
  }
}
```

### 2. Generate Masks

```bash
POST /v1/mask/generate
Content-Type: application/json

{
  "upload_id": "<model_upload_id>",
  "auto_refine": true
}
```

**Response:**
```json
{
  "masks": [
    {
      "id": "<mask_id>",
      "type": "top",
      "cloudinary": {
        "public_id": "...",
        "secure_url": "..."
      }
    },
    {
      "id": "<mask_id>",
      "type": "bottom",
      "cloudinary": {...}
    }
  ]
}
```

### 3. Apply Preview (Fast)

```bash
POST /v1/outfit/apply_preview
Content-Type: application/json

{
  "project_id": "...",
  "model_upload_id": "...",
  "top_fabric_upload_id": "...",
  "mask_top_id": "...",
  "scale": 1.0
}
```

**Response:**
```json
{
  "preview": {
    "cloudinary": {
      "public_id": "...",
      "secure_url": "..."
    },
    "job_id": "..."
  }
}
```

### 4. Generate HD Render

```bash
POST /v1/outfit/generate_hd
Content-Type: application/json

{
  "project_id": "...",
  "model_upload_id": "...",
  "top_fabric_upload_id": "...",
  "mask_top_id": "...",
  "prompt": "elegant silk fabric"
}
```

**Response:**
```json
{
  "job_id": "<job_id>",
  "status": "queued"
}
```

### 5. Check Job Status

```bash
GET /v1/job/{job_id}
```

**Response:**
```json
{
  "_id": "...",
  "status": "done",
  "progress": 100,
  "result": {
    "cloudinary": {
      "public_id": "...",
      "secure_url": "..."
    }
  }
}
```

## Local Development (Without Docker)

### 1. Install Dependencies

**API:**
```bash
cd vercel-deploy/api
pip install -r requirements.txt
```

**Worker:**
```bash
cd worker-deploy/worker
pip install -r requirements.txt
pip install git+https://github.com/facebookresearch/segment-anything.git
```

### 2. Start Services

**Terminal 1 - MongoDB:**
```bash
docker run -d -p 27017:27017 mongo:6
```

**Terminal 2 - Redis:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Terminal 3 - API:**
```bash
cd vercel-deploy/api
uvicorn app:app --reload --port 8000
```

**Terminal 4 - Worker:**
```bash
cd worker-deploy/worker
celery -A tasks worker --loglevel=info
```

## Testing

### Unit Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/
```

### Integration Test (Smoke Test)

```bash
# 1. Upload model image
curl -X POST "http://localhost:8000/v1/upload" \
  -F "file=@test_image.jpg" \
  -F "type=model"

# 2. Generate masks (use upload_id from step 1)
curl -X POST "http://localhost:8000/v1/mask/generate" \
  -H "Content-Type: application/json" \
  -d '{"upload_id": "<upload_id>", "auto_refine": true}'

# 3. Apply preview (use IDs from previous steps)
curl -X POST "http://localhost:8000/v1/outfit/apply_preview" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test",
    "model_upload_id": "<model_id>",
    "top_fabric_upload_id": "<fabric_id>",
    "mask_top_id": "<mask_id>"
  }'
```

## Project Structure

```
BuildEachAll245/
├── vercel-deploy/         # Frontend + API (deploy to Vercel)
│   ├── api/              # FastAPI application
│   │   ├── app.py        # Main FastAPI app
│   │   ├── index.py      # Vercel serverless entry
│   │   ├── routes/       # API endpoints
│   │   ├── core/         # Core utilities
│   │   └── requirements.txt
│   ├── src/              # React frontend
│   ├── vercel.json       # Vercel config
│   └── package.json
│
├── worker-deploy/         # Worker (deploy to Railway/Render)
│   ├── worker/           # Celery worker
│   │   ├── tasks.py      # Background tasks
│   │   ├── inference/    # AI inference modules
│   │   └── requirements.txt
│   ├── Dockerfile        # GPU version
│   └── Dockerfile.cpu    # CPU version
│
├── docker/                # Docker configuration
│   ├── Dockerfile.api
│   ├── Dockerfile.worker
│   ├── Dockerfile.worker.cpu
│   └── docker-compose.yml
│
├── tests/                 # Test files
│   ├── test_upload.py
│   ├── test_mask.py
│   └── test_integration.py
│
├── notebooks/            # Jupyter notebooks (reference)
│
├── .env.example          # Environment template
└── README.md
```

## Configuration

### SAM Model Selection

Edit `worker/inference/sam_segmentation.py`:

```python
MODEL_CHECKPOINT = "/weights/sam_vit_h.pth"  # or sam_vit_l.pth, sam_vit_b.pth
MODEL_TYPE = "vit_h"  # or "vit_l", "vit_b"
```

### Stable Diffusion Model

Set in `.env`:
```
SD_MODEL_ID=runwayml/stable-diffusion-inpainting
```

Alternative models:
- `stabilityai/stable-diffusion-2-inpainting`
- Custom fine-tuned models

### Using SlimSAM

To use SlimSAM instead of SAM:

1. Install: `pip install slimsam`
2. Update `sam_segmentation.py`:
   ```python
   from slimsam import build_slimsam
   model = build_slimsam("slimsam-77")
   ```

## Production Deployment

### Security Checklist

- [ ] Change `SECRET_KEY` in production
- [ ] Set `CORS_ORIGINS` to specific domains
- [ ] Use MongoDB authentication
- [ ] Enable Cloudinary signed URLs for private images
- [ ] Set up rate limiting
- [ ] Use HTTPS
- [ ] Monitor GPU usage and costs

### Scaling

- **API**: Use multiple uvicorn workers or Gunicorn
- **Worker**: Scale Celery workers horizontally
- **MongoDB**: Use replica sets for high availability
- **Redis**: Use Redis Cluster for high throughput

### Monitoring

- **Celery**: Monitor queue length and job durations
- **GPU**: Track utilization and memory usage
- **API**: Monitor response times and error rates
- **Cloudinary**: Track bandwidth and storage usage

### Cost Optimization

- **Preview Mode**: Free tier (CPU-only, fast)
- **HD Renders**: Charge per render or use credits
- **Cloudinary**: Use transformations for previews (cheaper)
- **GPU**: Use spot instances or reserved capacity

## Troubleshooting

### SAM Model Not Found

```
FileNotFoundError: SAM checkpoint not found
```

**Solution:** Download SAM checkpoint to `/weights/` directory

### CUDA Out of Memory

```
RuntimeError: CUDA out of memory
```

**Solution:**
- Reduce batch size
- Use smaller SD model
- Enable attention slicing (already enabled)
- Use CPU fallback for previews

### Celery Worker Not Processing Jobs

**Check:**
1. Redis is running: `docker ps | grep redis`
2. Worker is connected: Check Celery logs
3. Job is queued: Check MongoDB `jobs` collection

### Mask Quality Issues

**Improvements:**
1. Use pose detection (MediaPipe) to guide mask selection
2. Provide user mask editing UI
3. Fine-tune SAM on fashion images
4. Use multiple mask candidates and select best

## Advanced Features

### Fabric Conditioning

For better fabric matching in SD inpainting:

1. **DreamBooth Fine-tuning**: Train SD on fabric images
2. **ControlNet**: Use ControlNet for precise control
3. **Image Embeddings**: Use CLIP embeddings to guide generation

### Mask Refinement

- Use pose keypoints to identify top/bottom regions
- Combine multiple SAM predictions
- Apply morphological operations for cleaner masks

## License

MIT License

## Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Documentation: See inline code comments
- Email: support@styleweave.ai

