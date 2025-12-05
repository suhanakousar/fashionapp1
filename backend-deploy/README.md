# Backend API Deployment

This folder contains the **FastAPI Backend** that should be deployed separately from the frontend.

## 🚀 Quick Deploy

### Option 1: Railway (Recommended - Easiest)

1. Push this folder to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select this folder/repo
5. Railway will auto-detect `railway.json`
6. Add environment variables (see below)
7. Deploy!

### Option 2: Render

1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repository
4. **Root Directory**: `backend-deploy`
5. **Build Command**: (auto-detected from Dockerfile)
6. **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
7. Add environment variables
8. Deploy!

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

## 🔗 API Endpoints

After deployment, your API will be available at:
- `https://your-backend.railway.app/v1/*` - All API endpoints
- `https://your-backend.railway.app/health` - Health check
- `https://your-backend.railway.app/docs` - API documentation

## 📝 Update Frontend

After deploying the backend, update your frontend to use the backend URL:

1. Set environment variable in Vercel:
   - `VITE_API_URL=https://your-backend.railway.app`

2. Or update frontend code to use the backend URL directly

## 💰 Cost

- **Railway**: Free tier available, ~$5/month for hobby
- **Render**: Free tier available, ~$7/month for starter
- **Cloud Run**: Pay per use

