# 🚀 Deployment Guide

This project is split into **3 separate deployments**:

## 📁 Project Structure

```
BuildEachAll245/
├── vercel-deploy/     → Frontend (React + Vite) → Deploy to Vercel
├── backend-deploy/    → Backend API (FastAPI) → Deploy to Railway/Render
└── worker-deploy/     → ML Worker (Celery) → Deploy to GPU server
```

---

## 1️⃣ Frontend → Vercel

### Quick Deploy

1. **Set Root Directory in Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Settings → General → Root Directory
   - Set to: `vercel-deploy`
   - Save

2. **Add Environment Variable:**
   - Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend.railway.app`
   - (Replace with your actual backend URL)

3. **Deploy:**
   - Push to GitHub
   - Vercel auto-deploys

### What's Deployed
- ✅ React frontend
- ✅ Static assets
- ❌ No Python/API code

---

## 2️⃣ Backend API → Railway (Recommended)

### Quick Deploy

1. **Push to GitHub** (backend-deploy folder)

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select repository
   - Railway auto-detects `railway.json`

3. **Add Environment Variables:**
   ```bash
   MONGO_URI=mongodb+srv://...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   CLOUDINARY_FOLDER=styleweave
   CORS_ORIGINS=https://your-frontend.vercel.app
   SECRET_KEY=your-secret-key
   ```

4. **Get Backend URL:**
   - Railway provides: `https://your-app.railway.app`
   - Use this in frontend `VITE_API_URL`

### Alternative: Render

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. **Root Directory:** `backend-deploy`
5. **Build Command:** (auto from Dockerfile)
6. **Start Command:** `uvicorn api.app:app --host 0.0.0.0 --port $PORT`
7. Add environment variables
8. Deploy

### What's Deployed
- ✅ FastAPI backend
- ✅ All API routes (`/v1/*`)
- ✅ Health check (`/health`)
- ✅ API docs (`/docs`)

---

## 3️⃣ ML Worker → GPU Server (Optional)

The Celery worker requires GPU for AI/ML models. Deploy to:

- **Google Cloud Run** (with GPU)
- **AWS EC2** (g4dn instance)
- **Paperspace Gradient**
- **RunPod**

See `worker-deploy/README.md` for details.

---

## 🔗 Connecting Frontend to Backend

### After Backend Deployment:

1. **Get your backend URL:**
   - Railway: `https://your-app.railway.app`
   - Render: `https://your-app.onrender.com`

2. **Update Vercel Environment Variable:**
   - Vercel Dashboard → Settings → Environment Variables
   - `VITE_API_URL` = `https://your-backend.railway.app`

3. **Redeploy frontend:**
   - Vercel auto-redeploys on env var changes
   - Or trigger manual redeploy

### Frontend Code:

The frontend uses `src/lib/api.ts` which automatically uses `VITE_API_URL`:

```typescript
import { api } from '@/lib/api';

// Upload model
const result = await api.uploadModel(file);

// Generate outfit
const outfit = await api.generateOutfit({ job_id, ... });
```

---

## ✅ Checklist

### Frontend (Vercel)
- [ ] Root Directory set to `vercel-deploy`
- [ ] `VITE_API_URL` environment variable set
- [ ] Build succeeds
- [ ] Frontend loads correctly

### Backend (Railway/Render)
- [ ] All environment variables set
- [ ] Backend deploys successfully
- [ ] `/health` endpoint works
- [ ] `/docs` shows API documentation
- [ ] CORS allows frontend origin

### Testing
- [ ] Frontend can call backend API
- [ ] Upload endpoints work
- [ ] CORS errors resolved

---

## 🐛 Troubleshooting

### Frontend can't reach backend
- ✅ Check `VITE_API_URL` is set correctly
- ✅ Check backend CORS allows frontend origin
- ✅ Check backend is deployed and running

### CORS Errors
- ✅ Add frontend URL to backend `CORS_ORIGINS`
- ✅ Format: `https://your-app.vercel.app` (no trailing slash)

### Build Failures
- ✅ Check Root Directory in Vercel dashboard
- ✅ Check all files are committed to Git
- ✅ Check `vercel-deploy/package.json` exists

---

## 📝 Notes

- **Frontend** = Static React app (Vercel)
- **Backend** = Python FastAPI (Railway/Render)
- **Worker** = GPU ML tasks (Separate server)

Each can be deployed independently! 🎉
