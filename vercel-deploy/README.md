# Vercel Deployment - Frontend + API

This folder contains everything needed to deploy the **Frontend (React + Vite)** and **Backend API (FastAPI)** to Vercel.

## 🚀 Quick Deploy to Vercel

### Option 1: Via Vercel CLI (Recommended)

```bash
# Navigate to this folder
cd vercel-deploy

# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time - follow prompts)
vercel

# Deploy to production
vercel --prod
```

### Option 2: Via GitHub

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. **Set Root Directory**: Select `vercel-deploy` folder
6. Add environment variables (see below)
7. Deploy!

## 📋 Required Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
# MongoDB Connection
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/styleweave?retryWrites=true&w=majority

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=styleweave

# CORS (use your Vercel domain after deployment)
CORS_ORIGINS=https://your-app.vercel.app

# Security
SECRET_KEY=your-secret-key-here-generate-with-openssl-rand-hex-32
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## 📁 Project Structure

```
vercel-deploy/
├── src/              # React frontend source
├── api/              # FastAPI backend
│   ├── index.py      # Vercel serverless function entry
│   ├── app.py        # FastAPI application
│   ├── routes/       # API routes
│   └── requirements.txt
├── index.html        # Frontend entry point
├── package.json      # Frontend dependencies
├── vite.config.ts    # Vite configuration
└── vercel.json       # Vercel configuration
```

## 🔗 API Endpoints

After deployment, your API will be available at:

- `https://your-app.vercel.app/v1/*` - All API endpoints
- `https://your-app.vercel.app/health` - Health check
- `https://your-app.vercel.app/docs` - API documentation (Swagger UI)

## ⚠️ Important Notes

1. **Worker Not Included**: The ML worker (Celery) is NOT in this folder. Deploy it separately from `worker-deploy/` folder.

2. **Function Timeout**: 
   - Free tier: 10 seconds
   - Pro tier: 60 seconds
   - For longer operations, use background jobs with the worker

3. **CORS**: Update `CORS_ORIGINS` after deployment with your actual Vercel domain.

## 🧪 Testing

After deployment:

1. **Frontend**: Visit `https://your-app.vercel.app`
2. **API Health**: `curl https://your-app.vercel.app/health`
3. **API Docs**: Visit `https://your-app.vercel.app/docs`

## 📚 More Information

See `../VERCEL_DEPLOYMENT.md` for detailed deployment guide.

