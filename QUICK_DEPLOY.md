# ⚡ Quick Deploy Instructions

## 📦 What Was Created

Two ready-to-deploy folders:

1. **`vercel-deploy/`** - Frontend + API (Deploy to Vercel)
2. **`worker-deploy/`** - ML Worker (Deploy to Railway/Render)

---

## 📝 Note

**Source code is in deployment folders:**
- Edit code in `vercel-deploy/` and `worker-deploy/`
- No sync needed - single source of truth!

---

## 🚀 Deploy in 2 Steps

### Step 1: Deploy to Vercel (5 minutes)

```bash
cd vercel-deploy
vercel login
vercel --prod
```

**Or via GitHub:**
- Push `vercel-deploy/` to GitHub
- Go to vercel.com → New Project → Import
- Set root: `vercel-deploy`
- Add env vars (see below)
- Deploy!

### Step 2: Deploy Worker (5 minutes)

**Railway (Easiest):**
- Push `worker-deploy/` to GitHub
- Go to railway.app → New Project
- Deploy from GitHub
- Add env vars (see below)
- Deploy!

**Or Render:**
- Go to render.com → New Background Worker
- Connect GitHub → Select `worker-deploy/`
- Deploy!

---

## 🔑 Environment Variables

### Vercel (`vercel-deploy/`)
```
MONGO_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CORS_ORIGINS=https://your-app.vercel.app
SECRET_KEY=...
```

### Worker (`worker-deploy/`)
```
MONGO_URI=mongodb+srv://... (SAME as Vercel)
REDIS_URL=redis://...
CLOUDINARY_CLOUD_NAME=... (SAME as Vercel)
CLOUDINARY_API_KEY=... (SAME as Vercel)
CLOUDINARY_API_SECRET=... (SAME as Vercel)
```

---

## ✅ Done!

Your app will be live at: `https://your-app.vercel.app`

For detailed guides, see:
- `vercel-deploy/README.md`
- `worker-deploy/README.md`
- `DEPLOYMENT_GUIDE.md`

