# 🚀 Deployment Guide - Quick Start

This project is organized into **two separate deployment folders** for easy deployment:

## 📁 Folder Structure

```
BuildEachAll245/
├── vercel-deploy/     ← Deploy this to Vercel (Frontend + API)
└── worker-deploy/     ← Deploy this separately (ML Worker)
```

---

## 🎯 Quick Deployment

### Step 1: Deploy Frontend + API to Vercel

```bash
cd vercel-deploy
vercel login
vercel --prod
```

**Or via GitHub:**
1. Push `vercel-deploy/` folder to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import repository
4. Set root directory: `vercel-deploy`
5. Add environment variables (see below)
6. Deploy!

📖 **Full guide**: See `vercel-deploy/README.md`

---

### Step 2: Deploy Worker (Choose one platform)

#### Option A: Railway (Easiest) ⭐ Recommended

```bash
cd worker-deploy
# Push to GitHub, then:
# 1. Go to railway.app
# 2. New Project → Deploy from GitHub
# 3. Select worker-deploy folder
# 4. Add environment variables
# 5. Deploy!
```

#### Option B: Render

1. Go to [render.com](https://render.com)
2. New → Background Worker
3. Connect GitHub repo
4. Set root directory: `worker-deploy`
5. Deploy!

#### Option C: Google Cloud Run / AWS ECS

See `worker-deploy/README.md` for detailed instructions.

📖 **Full guide**: See `worker-deploy/README.md`

---

## 🔑 Required Environment Variables

### For Vercel (vercel-deploy/)

Set in Vercel Dashboard → Settings → Environment Variables:

```bash
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/styleweave
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGINS=https://your-app.vercel.app
SECRET_KEY=your-secret-key
```

### For Worker (worker-deploy/)

Set in Railway/Render/Cloud dashboard:

```bash
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/styleweave  # Same as Vercel
REDIS_URL=redis://:password@host:6379/0
CLOUDINARY_CLOUD_NAME=your_cloud_name  # Same as Vercel
CLOUDINARY_API_KEY=your_api_key       # Same as Vercel
CLOUDINARY_API_SECRET=your_api_secret # Same as Vercel
```

**Important**: Worker and API must use the **same MongoDB** and **same Cloudinary**!

---

## 📊 Architecture

```
┌─────────────────┐
│   Vercel        │
│  (Frontend)     │ ────┐
│  (FastAPI)      │     │
└─────────────────┘     │
                        │
                   ┌────▼────┐
                   │ MongoDB │
                   └────┬────┘
                        │
┌─────────────────┐    │
│   Railway/      │    │
│   Render/       │ ───┘
│   Cloud Run     │
│  (Celery Worker)│
└─────────────────┘
```

---

## ✅ Deployment Checklist

### Vercel Deployment
- [ ] Navigate to `vercel-deploy/` folder
- [ ] Run `vercel` or connect via GitHub
- [ ] Add all environment variables
- [ ] Deploy and get URL
- [ ] Update `CORS_ORIGINS` with Vercel URL
- [ ] Test: Visit `https://your-app.vercel.app`
- [ ] Test API: Visit `https://your-app.vercel.app/docs`

### Worker Deployment
- [ ] Choose platform (Railway/Render/Cloud)
- [ ] Navigate to `worker-deploy/` folder
- [ ] Push to GitHub or deploy directly
- [ ] Add all environment variables (same MongoDB/Cloudinary as Vercel)
- [ ] Deploy
- [ ] Check logs to verify worker is running
- [ ] Test: Create a job via API, check worker processes it

---

## 🧪 Testing After Deployment

1. **Frontend**: Visit your Vercel URL
2. **API Health**: `curl https://your-app.vercel.app/health`
3. **API Docs**: Visit `https://your-app.vercel.app/docs`
4. **Worker**: Check logs in Railway/Render dashboard

---

## 💰 Cost Estimate

| Component | Platform | Cost |
|-----------|----------|------|
| Frontend + API | Vercel (Free) | $0/month |
| Worker | Railway (Hobby) | ~$5/month |
| Worker | Railway (Pro + GPU) | ~$20/month |
| Worker | Render (Starter) | ~$7/month |
| Worker | Render (Standard + GPU) | ~$25/month |
| MongoDB | MongoDB Atlas (Free) | $0/month |
| Redis | Upstash (Free) | $0/month |
| Cloudinary | Free tier | $0/month |

**Total (Free tier)**: $0/month  
**Total (With GPU worker)**: ~$20-25/month

---

## 🆘 Troubleshooting

### Vercel Issues
- **Build fails**: Check `vercel-deploy/package.json` dependencies
- **API not working**: Check `vercel-deploy/api/index.py` and logs
- **CORS errors**: Update `CORS_ORIGINS` with your Vercel domain

### Worker Issues
- **Worker not starting**: Check environment variables
- **Jobs not processing**: Verify Redis connection
- **GPU errors**: Check if platform supports GPU

---

## 📚 Detailed Guides

- **Vercel Deployment**: See `vercel-deploy/README.md`
- **Worker Deployment**: See `worker-deploy/README.md`
- **Full Documentation**: See `VERCEL_DEPLOYMENT.md`

---

## 🎉 You're Ready!

1. Deploy `vercel-deploy/` to Vercel
2. Deploy `worker-deploy/` to Railway/Render
3. Connect them with same MongoDB/Cloudinary
4. Start using your app!

Good luck! 🚀

