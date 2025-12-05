# 🚀 Worker Deployment Guide - ML Background Jobs

The **Celery Worker** handles ML/AI inference tasks (SAM segmentation, Stable Diffusion inpainting).

## ⚠️ Important Notes

- **Requires GPU** for optimal performance (Stable Diffusion)
- **Requires Redis** for task queue
- **Cannot deploy to Vercel** (needs long-running processes)
- **Optional** - App works without it, but ML features won't function

## 🎯 Quick Deploy Options

### Option 1: Railway (Easiest - Recommended)

1. **Go to [railway.app](https://railway.app)**
2. **New Project** → **Deploy from GitHub**
3. **Select your repository**
4. **Add Service** → **Empty Service**
5. **Settings:**
   - **Root Directory**: `worker-deploy`
   - Railway will auto-detect `railway.json`
6. **Add Environment Variables:**
   ```
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/styleweave
   REDIS_URL=redis://:password@host:6379/0
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
7. **Add Redis Service** (in Railway):
   - Click **"+ New"** → **"Database"** → **"Add Redis"**
   - Copy the `REDIS_URL` and add to worker environment variables
8. **Deploy!**

**Note**: Railway free tier doesn't include GPU. For GPU, upgrade to Pro plan.

---

### Option 2: Render (Background Worker)

1. **Go to [render.com](https://render.com)**
2. **New +** → **"Background Worker"**
3. **Connect GitHub repository**
4. **Settings:**
   - **Name**: `styleweave-worker`
   - **Root Directory**: `worker-deploy`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile.cpu` (for CPU) or `Dockerfile` (for GPU)
   - **Docker Context**: `worker-deploy`
5. **Add Environment Variables** (same as Railway)
6. **Add Redis** (Render → New → Redis)
7. **Deploy!**

**Note**: Render free tier doesn't include GPU. For GPU, upgrade to Standard plan.

---

### Option 3: Google Cloud Run (with GPU) - Best for Production

#### Prerequisites
- Google Cloud account
- `gcloud` CLI installed
- Billing enabled

#### Steps

1. **Build Docker image:**
   ```bash
   cd worker-deploy
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/worker
   ```

2. **Deploy with GPU:**
   ```bash
   gcloud run deploy worker \
     --image gcr.io/YOUR_PROJECT_ID/worker \
     --platform managed \
     --region us-central1 \
     --memory 8Gi \
     --cpu 4 \
     --gpu 1 \
     --gpu-type nvidia-t4 \
     --set-env-vars "MONGO_URI=...,REDIS_URL=...,CLOUDINARY_CLOUD_NAME=..."
   ```

3. **Set environment variables** via Cloud Console or CLI

**Cost**: ~$0.11/hour for GPU instance + compute

---

### Option 4: RunPod / Paperspace (GPU Cloud)

#### RunPod (Recommended for GPU)

1. **Sign up**: [runpod.io](https://www.runpod.io)
2. **Create Pod** → **GPU Template**
3. **Upload Docker image** or use RunPod's template
4. **Configure environment variables**
5. **Start Pod**

**Cost**: Pay per hour, ~$0.30-0.50/hour for GPU

#### Paperspace Gradient

1. **Sign up**: [paperspace.com](https://www.paperspace.com)
2. **Create Notebook** → **Gradient**
3. **Upload code** or connect GitHub
4. **Configure environment**
5. **Run**

---

### Option 5: Local / VPS (For Development)

If you have a GPU-enabled machine:

```bash
cd worker-deploy
docker build -t worker -f Dockerfile .
docker run -d --gpus all \
  -e MONGO_URI=... \
  -e REDIS_URL=... \
  -e CLOUDINARY_CLOUD_NAME=... \
  -e CLOUDINARY_API_KEY=... \
  -e CLOUDINARY_API_SECRET=... \
  worker
```

---

## 📋 Required Environment Variables

```bash
# Required
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/styleweave
REDIS_URL=redis://:password@host:6379/0
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional (for GPU)
CUDA_VISIBLE_DEVICES=0
SAM_CHECKPOINT=/weights/sam_vit_h.pth
SD_MODEL_ID=runwayml/stable-diffusion-inpainting
```

---

## 🔗 Connecting to Backend

The worker needs:
- **Same MongoDB** as your backend (reads jobs from `db.jobs`)
- **Same Redis** (Celery task queue)
- **Same Cloudinary** (uploads results)

Make sure environment variables match your backend!

---

## 🧪 Testing Worker

1. **Check worker is running:**
   - Railway/Render logs should show: `celery@hostname ready`

2. **Test job processing:**
   - Create a job via your API (`/v1/outfit/generate`)
   - Check worker logs for processing
   - Verify job status updates in MongoDB

3. **Check Redis connection:**
   ```bash
   # In worker logs, you should see:
   Connected to redis://...
   ```

---

## 💰 Cost Comparison

| Platform | Free Tier | GPU Support | Monthly Cost (GPU) | Ease |
|----------|-----------|-------------|-------------------|------|
| **Railway** | ✅ Limited | ❌ No | N/A | ⭐⭐⭐⭐⭐ |
| **Render** | ✅ Limited | ❌ No | N/A | ⭐⭐⭐⭐ |
| **Cloud Run** | ❌ No | ✅ Yes | ~$80-160 | ⭐⭐⭐ |
| **RunPod** | ❌ No | ✅ Yes | ~$200-400 | ⭐⭐⭐⭐ |
| **Paperspace** | ❌ No | ✅ Yes | ~$150-300 | ⭐⭐⭐ |
| **Local VPS** | N/A | ✅ Yes | Varies | ⭐⭐ |

---

## 🐛 Troubleshooting

### Worker Won't Start
- ✅ Check Redis connection (`REDIS_URL`)
- ✅ Check MongoDB connection (`MONGO_URI`)
- ✅ Check logs for errors
- ✅ Verify Dockerfile builds successfully

### Tasks Not Processing
- ✅ Check Redis is running and accessible
- ✅ Verify Celery can connect to Redis
- ✅ Check worker logs for task errors
- ✅ Verify backend is creating jobs in MongoDB

### GPU Not Available
- ✅ Use `Dockerfile.cpu` for CPU-only deployment
- ✅ Check platform supports GPU (upgrade plan)
- ✅ Verify CUDA drivers installed (for local)

### Out of Memory
- ✅ Reduce `--concurrency` in Celery command
- ✅ Increase memory allocation
- ✅ Use smaller models

---

## 📝 Notes

- **CPU vs GPU**: CPU works but is **much slower** (10-100x)
- **Free Tier**: Most platforms don't offer GPU on free tier
- **Development**: Use CPU version locally, GPU in production
- **Scaling**: Run multiple workers for better throughput

---

## 🚀 Quick Start (Railway)

1. Deploy backend first (get MongoDB URI)
2. Add Redis service in Railway
3. Deploy worker with same MongoDB URI
4. Test with API endpoint

That's it! 🎉

