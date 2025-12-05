# 🚀 Render Deployment Guide - Backend

Quick guide to deploy your backend to Render.

## Step-by-Step Instructions

### 1. Sign Up / Sign In
- Go to [render.com](https://render.com)
- Sign in with GitHub (recommended)

### 2. Create New Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**

### 3. Connect Repository
1. Click **"Connect account"** or **"Connect repository"**
2. Select your GitHub repository: `fashionapp1` (or your repo name)
3. Click **"Connect"**

### 4. Configure Service
Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `styleweave-backend` |
| **Root Directory** | `backend-deploy` |
| **Environment** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free (or Starter for better performance) |

### 5. Add Environment Variables
Click **"Add Environment Variable"** and add each one:

```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/styleweave
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=styleweave
CORS_ORIGINS=https://rajiyafashion-deyabyvz3-suhanakousars-projects.vercel.app
SECRET_KEY=your-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

**Important**: 
- Replace `CORS_ORIGINS` with your actual Vercel frontend URL
- Use a strong `SECRET_KEY` for production

### 6. Deploy
1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start your backend
3. Wait 2-5 minutes for deployment

### 7. Get Your Backend URL
After deployment, Render will provide:
- **URL**: `https://styleweave-backend.onrender.com`
- Copy this URL!

### 8. Test Your Backend
Open in browser:
- `https://styleweave-backend.onrender.com/health` → Should return `{"status": "healthy"}`
- `https://styleweave-backend.onrender.com/docs` → Should show FastAPI documentation

### 9. Update Frontend
1. Go to **Vercel Dashboard** → Your Project → Settings → Environment Variables
2. Add/Update:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://styleweave-backend.onrender.com`
3. **Redeploy** your frontend

## ✅ Checklist

- [ ] Backend deployed on Render
- [ ] Health check works (`/health`)
- [ ] API docs accessible (`/docs`)
- [ ] Environment variables set
- [ ] Frontend `VITE_API_URL` updated
- [ ] Frontend redeployed on Vercel
- [ ] Test API call from frontend

## 🐛 Troubleshooting

### Build Fails
- Check **Logs** tab in Render dashboard
- Verify `requirements.txt` exists in `backend-deploy/`
- Check Python version compatibility

### Backend Won't Start
- Check **Logs** tab for errors
- Verify `Start Command` is correct
- Check environment variables are set

### CORS Errors
- Verify `CORS_ORIGINS` includes your frontend URL
- No trailing slash in URL
- Format: `https://your-app.vercel.app`

### 502 Bad Gateway
- Check if backend is running (Logs tab)
- Verify port is `$PORT` (Render sets this automatically)
- Check if dependencies installed correctly

## 📝 Notes

- **Free Tier**: Services spin down after 15 minutes of inactivity (first request may be slow)
- **Auto-Deploy**: Render auto-deploys on every push to main branch
- **SSL**: Automatic HTTPS (free)
- **Logs**: Available in Render dashboard

## 🔗 Useful Links

- Render Dashboard: https://dashboard.render.com
- Your Backend: `https://styleweave-backend.onrender.com`
- API Docs: `https://styleweave-backend.onrender.com/docs`

