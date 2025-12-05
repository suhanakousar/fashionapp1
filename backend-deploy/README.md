# Backend + Worker Deployment

This folder contains the **FastAPI Backend** and **Celery Worker** combined in one deployment.

**What's included:**
- ✅ FastAPI backend (API routes)
- ✅ Celery worker (ML/AI background tasks)
- ✅ All in one deployment (simpler!)

## 🚀 Quick Deploy

### Option 1: Railway (Recommended - Easiest)

1. Push this folder to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select this folder/repo
5. Railway will auto-detect `railway.json`
6. Add environment variables (see below)
7. Deploy!

### Option 2: Render (Recommended for Python)

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. **Settings:**
   - **Name**: `styleweave-backend` (or any name you prefer)
   - **Root Directory**: `backend-deploy`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python start.py` (runs both FastAPI and Celery worker)
5. **Environment Variables** (click "Add Environment Variable" for each):
   ```
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/styleweave
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_FOLDER=styleweave
   CORS_ORIGINS=https://your-frontend.vercel.app
   SECRET_KEY=your-secret-key-here
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```
6. Click **"Create Web Service"**
7. Render will automatically deploy!

**Note**: Render provides a free tier with automatic SSL. Your backend URL will be: `https://styleweave-backend.onrender.com`

### Option 3: Google Cloud Run

```bash
cd backend-deploy
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/backend
gcloud run deploy backend \
  --image gcr.io/YOUR_PROJECT_ID/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000
```

## 📋 Required Environment Variables

```bash
# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/styleweave

# Redis (for Celery worker task queue)
REDIS_URL=redis://:password@host:6379/0

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=styleweave

# CORS (use your frontend Vercel URL)
CORS_ORIGINS=https://your-frontend.vercel.app

# Security
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

**Note**: You need to add a **Redis service** (Railway/Render provides this) for the Celery worker to work.

## 📁 Project Structure

All backend code is in one folder:
```
backend-deploy/
├── app.py              # Main FastAPI application
├── requirements.txt    # Python dependencies
├── routes/             # API route handlers
│   ├── upload.py
│   ├── mask.py
│   ├── outfit.py
│   └── jobs.py
├── core/               # Core utilities
│   ├── mongo.py
│   ├── cloudinary_utils.py
│   └── security.py
├── schemas.py          # Pydantic schemas
├── Dockerfile          # Container config
└── railway.json        # Railway deployment config
```

## 🔗 API Endpoints

After deployment, your API will be available at:
- `https://your-backend.onrender.com/v1/*` - All API endpoints (or railway.app if using Railway)
- `https://your-backend.onrender.com/health` - Health check
- `https://your-backend.onrender.com/docs` - API documentation (FastAPI Swagger UI)

## 📝 Update Frontend

After deploying the backend, update your frontend to use the backend URL:

1. Set environment variable in Vercel:
   - `VITE_API_URL=https://your-backend.onrender.com` (or railway.app if using Railway)

2. Or update frontend code to use the backend URL directly

## 💰 Cost

- **Railway**: Free tier available, ~$5/month for hobby
- **Render**: Free tier available, ~$7/month for starter
- **Cloud Run**: Pay per use

