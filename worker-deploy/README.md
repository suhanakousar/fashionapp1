# Worker Deployment - ML Background Jobs

This folder contains the **Celery Worker** that processes ML inference tasks (SAM segmentation, Stable Diffusion inpainting).

## ⚠️ Cannot Deploy to Vercel

This worker **cannot** be deployed to Vercel because it requires:
- GPU access (for Stable Diffusion)
- Long-running processes (Celery workers)
- Redis (for task queue)
- Large model files

## 🚀 Deployment Options

### Option 1: Railway (Recommended - Easiest)

#### Prerequisites
- Railway account: [railway.app](https://railway.app)
- GitHub account (for easy deployment)

#### Steps

1. **Install Railway CLI** (optional):
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Deploy via GitHub**:
   - Push this folder to GitHub
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this folder/repo
   - Railway will auto-detect `railway.json`

3. **Set Environment Variables** in Railway dashboard:
   ```bash
   # MongoDB (same as your API)
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/styleweave
   
   # Redis (use Railway's Redis service or Upstash)
   REDIS_URL=redis://:password@host:6379/0
   
   # Cloudinary (same as your API)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Optional
   CUDA_VISIBLE_DEVICES=0
   SAM_CHECKPOINT=/weights/sam_vit_h.pth
   SD_MODEL_ID=runwayml/stable-diffusion-inpainting
   ```

4. **Deploy**: Railway will automatically build and deploy!

#### Railway Pricing
- Free tier: Limited hours
- Hobby: ~$5/month
- Pro: ~$20/month (with GPU support)

---

### Option 2: Render

1. Go to [render.com](https://render.com)
2. Create new "Background Worker" service
3. Connect your GitHub repository
4. **Build Command**: (auto-detected from Dockerfile)
5. **Start Command**: `celery -A tasks worker --loglevel=info`
6. **Dockerfile Path**: `Dockerfile` (or `Dockerfile.cpu` for CPU-only)
7. Add environment variables (same as above)
8. Deploy!

#### Render Pricing
- Free tier: Limited (no GPU)
- Starter: ~$7/month
- Standard: ~$25/month (with GPU)

---

### Option 3: Google Cloud Run (with GPU)

#### Prerequisites
- Google Cloud account
- `gcloud` CLI installed

#### Steps

1. **Build Docker image**:
   ```bash
   cd worker-deploy
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/worker
   ```

2. **Deploy with GPU**:
   ```bash
   gcloud run deploy worker \
     --image gcr.io/YOUR_PROJECT_ID/worker \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 8Gi \
     --cpu 4 \
     --gpu 1 \
     --gpu-type nvidia-t4 \
     --set-env-vars "MONGO_URI=...,REDIS_URL=..."
   ```

#### Cloud Run Pricing
- Pay per use
- GPU instances: ~$0.11/hour + compute costs

---

### Option 4: AWS ECS/Fargate

1. Build and push to ECR
2. Create ECS task definition
3. Deploy with GPU-enabled instances
4. Configure environment variables

---

### Option 5: Dedicated VPS (DigitalOcean, Linode, etc.)

1. Get a GPU-enabled VPS
2. Install Docker and NVIDIA Docker
3. Build and run:
   ```bash
   docker build -t worker .
   docker run -d --gpus all \
     -e MONGO_URI=... \
     -e REDIS_URL=... \
     worker
   ```

---

## 🔧 Local Development

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  worker:
    build:
      context: .
      dockerfile: Dockerfile.cpu  # Use CPU version for local dev
    environment:
      - MONGO_URI=mongodb://mongo:27017/styleweave
      - REDIS_URL=redis://redis:6379/0
      - CLOUDINARY_CLOUD_NAME=your_cloud
      - CLOUDINARY_API_KEY=your_key
      - CLOUDINARY_API_SECRET=your_secret
    depends_on:
      - redis
      - mongo
    volumes:
      - ./weights:/weights  # Mount model weights if needed

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

Run:
```bash
docker-compose up
```

---

## 📋 Required Environment Variables

```bash
# Required
MONGO_URI=mongodb://host:27017/styleweave
REDIS_URL=redis://:password@host:6379/0
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional
CUDA_VISIBLE_DEVICES=0
SAM_CHECKPOINT=/weights/sam_vit_h.pth
SD_MODEL_ID=runwayml/stable-diffusion-inpainting
```

## 🔗 Connecting to API

The worker needs to connect to:
- **Same MongoDB** as your API (for reading jobs)
- **Same Redis** (for Celery task queue)
- **Same Cloudinary** (for uploading results)

Make sure environment variables match your API deployment!

## 🧪 Testing

1. **Check worker is running**:
   ```bash
   # In Railway/Render logs, you should see:
   celery@hostname ready
   ```

2. **Test job processing**:
   - Create a job via your API
   - Check worker logs for processing
   - Verify job status updates in MongoDB

## 📊 Monitoring

- **Railway**: Built-in logs and metrics
- **Render**: Dashboard with logs
- **Cloud Run**: Cloud Monitoring
- **Custom**: Use Celery Flower for monitoring

## 💰 Cost Comparison

| Platform | Free Tier | Paid (GPU) | Ease of Use |
|----------|-----------|------------|-------------|
| Railway  | Limited   | ~$20/mo    | ⭐⭐⭐⭐⭐ |
| Render   | Limited   | ~$25/mo    | ⭐⭐⭐⭐ |
| Cloud Run| No        | Pay/use    | ⭐⭐⭐ |
| AWS ECS  | No        | Pay/use    | ⭐⭐ |
| VPS      | No        | ~$40/mo    | ⭐⭐⭐ |

## 🎯 Recommended Setup

**For beginners**: Railway (easiest setup)  
**For production**: Google Cloud Run or AWS ECS (scalable, pay-per-use)  
**For budget**: VPS with GPU (one-time setup, fixed cost)

## 📚 More Information

See `../DEPLOYMENT.md` for detailed deployment strategies.

