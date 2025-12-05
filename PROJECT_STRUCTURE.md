# StyleWeave Backend - Complete Project Structure

## Directory Tree

```
styleweave/
├── api/                          # FastAPI application
│   ├── __init__.py
│   ├── app.py                    # Main FastAPI app
│   ├── schemas.py                # Pydantic models
│   ├── requirements.txt          # Python dependencies
│   ├── routes/                   # API endpoints
│   │   ├── __init__.py
│   │   ├── upload.py            # Image upload endpoint
│   │   ├── mask.py               # Mask generation endpoint
│   │   ├── outfit.py             # Preview & HD generation
│   │   └── jobs.py               # Job status endpoint
│   └── core/                     # Core utilities
│       ├── __init__.py
│       ├── cloudinary_utils.py   # Cloudinary integration
│       ├── mongo.py              # MongoDB connection
│       └── security.py           # JWT & auth helpers
│
├── worker/                       # Celery worker
│   ├── __init__.py
│   ├── tasks.py                 # Celery task definitions
│   ├── requirements.txt         # Worker dependencies
│   └── inference/               # AI inference modules
│       ├── __init__.py
│       ├── sam_segmentation.py  # SAM mask generation
│       ├── texture_apply.py     # OpenCV texture application
│       └── inpaint_sd.py        # Stable Diffusion inpainting
│
├── docker/                       # Docker configuration
│   ├── Dockerfile.api           # API container
│   ├── Dockerfile.worker        # GPU worker container
│   ├── Dockerfile.worker.cpu    # CPU worker container
│   ├── docker-compose.yml       # Full stack (GPU)
│   └── docker-compose.cpu.yml   # Full stack (CPU)
│
├── tests/                        # Test suite
│   ├── __init__.py
│   ├── conftest.py              # Pytest fixtures
│   ├── test_upload.py           # Upload tests
│   ├── test_mask.py             # Mask generation tests
│   └── test_integration.py      # Integration tests
│
├── notebooks/                    # Jupyter notebooks
│   └── README.md                # Notebook documentation
│
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── pytest.ini                   # Pytest configuration
├── README.md                    # Main documentation
├── SETUP.md                     # Setup instructions
├── DEPLOYMENT.md                # Deployment guide
└── PROJECT_STRUCTURE.md         # This file
```

## File Descriptions

### API Layer

**`api/app.py`**
- FastAPI application entry point
- CORS middleware configuration
- Router registration

**`api/routes/upload.py`**
- `POST /v1/upload` - Upload model/fabric images
- Validates file types
- Uploads to Cloudinary
- Stores metadata in MongoDB

**`api/routes/mask.py`**
- `POST /v1/mask/generate` - Generate segmentation masks
- Calls SAM segmentation
- Uploads masks to Cloudinary
- Returns mask IDs

**`api/routes/outfit.py`**
- `POST /v1/outfit/apply_preview` - Fast preview (OpenCV)
- `POST /v1/outfit/generate_hd` - Queue HD render job
- Downloads images from Cloudinary
- Processes locally or queues Celery task

**`api/routes/jobs.py`**
- `GET /v1/job/{job_id}` - Get job status
- `GET /v1/jobs` - List jobs with filters

**`api/core/cloudinary_utils.py`**
- Cloudinary upload helper
- URL transformation builder

**`api/core/mongo.py`**
- MongoDB async client (Motor)
- Database connection

**`api/core/security.py`**
- JWT token creation/verification
- Password hashing

### Worker Layer

**`worker/tasks.py`**
- Celery task definitions
- `generate_hd_task` - HD rendering task
- Downloads images, runs inference, uploads results

**`worker/inference/sam_segmentation.py`**
- SAM model loading (cached)
- `run_sam_on_image_from_url()` - Generate masks
- Heuristic mask selection (top/bottom)

**`worker/inference/texture_apply.py`**
- `apply_texture_preview()` - Fast OpenCV texture application
- Texture tiling and seamless cloning
- No GPU required

**`worker/inference/inpaint_sd.py`**
- Stable Diffusion inpainting pipeline
- `run_inpainting()` - Apply fabric via SD
- GPU-accelerated, cached pipeline

### Docker

**`docker/Dockerfile.api`**
- Python 3.11 slim base
- FastAPI dependencies
- Exposes port 8000

**`docker/Dockerfile.worker`**
- NVIDIA CUDA base
- GPU dependencies (PyTorch, diffusers)
- Celery worker

**`docker/Dockerfile.worker.cpu`**
- Python 3.11 slim base
- CPU-only dependencies
- For local dev without GPU

**`docker/docker-compose.yml`**
- Full stack: MongoDB, Redis, API, Worker (GPU)

**`docker/docker-compose.cpu.yml`**
- Full stack: MongoDB, Redis, API, Worker (CPU)

### Tests

**`tests/test_upload.py`**
- Unit tests for upload endpoint
- Mock Cloudinary and MongoDB

**`tests/test_mask.py`**
- Unit tests for mask generation
- Mock SAM segmentation

**`tests/test_integration.py`**
- Integration tests for full workflow
- Requires running services

**`tests/conftest.py`**
- Pytest fixtures
- Mock helpers

## Data Flow

### Upload Flow
```
Client → POST /v1/upload → FastAPI → Cloudinary → MongoDB → Response
```

### Preview Flow
```
Client → POST /v1/outfit/apply_preview
  → FastAPI downloads images
  → texture_apply.apply_texture_preview()
  → Upload result to Cloudinary
  → Store job in MongoDB
  → Return preview URL
```

### HD Render Flow
```
Client → POST /v1/outfit/generate_hd
  → FastAPI creates job (status: queued)
  → Enqueue Celery task
  → Worker downloads images
  → run_inpainting() (GPU)
  → Upload result to Cloudinary
  → Update job (status: done)
  → Client polls GET /v1/job/{id}
```

## MongoDB Collections

### `uploads`
```json
{
  "_id": ObjectId,
  "project_id": "string",
  "type": "model" | "top_fabric" | "bottom_fabric" | "mask_top" | "mask_bottom",
  "cloudinary": {
    "public_id": "string",
    "secure_url": "string",
    "width": number,
    "height": number
  },
  "meta": {
    "original_filename": "string",
    "source_upload": "string"  // for masks
  },
  "created_at": ISODate
}
```

### `jobs`
```json
{
  "_id": ObjectId,
  "project_id": "string",
  "type": "preview" | "hd_render",
  "status": "queued" | "running" | "done" | "failed",
  "params": {
    "model_upload_id": "string",
    "top_fabric_upload_id": "string",
    "mask_top_id": "string",
    "prompt": "string"
  },
  "progress": 0-100,
  "result": {
    "cloudinary": {
      "public_id": "string",
      "secure_url": "string"
    }
  },
  "error": "string",  // if failed
  "created_at": ISODate,
  "updated_at": ISODate
}
```

## Environment Variables

See `.env.example` for complete list.

**Required:**
- `MONGO_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `CLOUDINARY_*` - Cloudinary credentials
- `SECRET_KEY` - JWT secret

**Optional:**
- `SAM_CHECKPOINT` - Path to SAM model
- `SD_MODEL_ID` - Stable Diffusion model ID
- `CUDA_VISIBLE_DEVICES` - GPU device selection

## Key Dependencies

**API:**
- FastAPI, Uvicorn
- Motor (async MongoDB)
- Cloudinary SDK
- Pydantic

**Worker:**
- Celery, Redis
- PyMongo
- PyTorch, Diffusers
- segment-anything
- OpenCV, Pillow

## Next Steps

1. **Download SAM checkpoint** to `/weights/`
2. **Configure `.env`** with credentials
3. **Run Docker Compose** to start services
4. **Test API** at http://localhost:8000/docs
5. **Upload test images** and verify workflow

See `README.md` for detailed setup instructions.

