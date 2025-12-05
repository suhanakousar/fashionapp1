# 🔗 Connect Frontend to Backend

## Your URLs
- **Backend**: https://fashionapp1.onrender.com/
- **Frontend**: https://fashionapp1.vercel.app

## Step 1: Update Backend CORS (Render)

1. Go to **Render Dashboard** → Your service (`fashionapp1`)
2. Go to **Environment** tab
3. Find `CORS_ORIGINS` variable
4. Update it to:
   ```
   https://fashionapp1.vercel.app
   ```
   (No trailing slash!)
5. **Save** - Render will auto-redeploy

## Step 2: Add API URL to Frontend (Vercel)

1. Go to **Vercel Dashboard** → Your project
2. Go to **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://fashionapp1.onrender.com`
   - **Environment**: Production, Preview, Development (select all)
5. Click **"Save"**
6. **Redeploy** your frontend:
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

## Step 3: Test Connection

After both redeploy:

1. **Test Backend**: https://fashionapp1.onrender.com/health
   - Should return: `{"status": "healthy"}`

2. **Test Frontend**: https://fashionapp1.vercel.app
   - Should load the app (not stuck on loading)

3. **Test API from Frontend**:
   - Open browser console (F12)
   - You should see API calls to `https://fashionapp1.onrender.com`

## ✅ Checklist

- [ ] Backend CORS updated with frontend URL
- [ ] Frontend `VITE_API_URL` environment variable added
- [ ] Frontend redeployed
- [ ] Backend redeployed (auto after CORS change)
- [ ] Test both URLs work

## 🐛 Troubleshooting

### CORS Errors
- Check `CORS_ORIGINS` includes frontend URL exactly (no trailing slash)
- Format: `https://fashionapp1.vercel.app` (not `https://fashionapp1.vercel.app/`)

### Frontend Still Loading
- Check browser console for errors
- Verify `VITE_API_URL` is set in Vercel
- Hard refresh: `Ctrl + Shift + R`

### API Not Working
- Check backend logs in Render
- Test backend directly: https://fashionapp1.onrender.com/health
- Check CORS allows frontend origin

