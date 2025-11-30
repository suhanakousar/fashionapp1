# Deploy to Render - Step by Step Guide

## 🚀 Complete Render Deployment Guide

### Prerequisites
- GitHub account
- Render account (sign up at [render.com](https://render.com))
- Your code pushed to GitHub

---

## Step 1: Prepare Your Repository

Make sure your code is on GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## Step 2: Create PostgreSQL Database on Render

1. **Go to [Render Dashboard](https://dashboard.render.com)**

2. **Create PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - Name: `fashion-designer-db` (or any name)
   - Database: `fashion_designer` (or any name)
   - Region: Choose closest to you
   - PostgreSQL Version: 16 (or latest)
   - Plan: Free (or Starter for production)
   - Click "Create Database"

3. **Copy Database URL:**
   - Wait for database to be ready (1-2 minutes)
   - Click on your database
   - Go to "Connections" tab
   - Copy the "Internal Database URL" (we'll use this)
   - **Important:** Use "Internal Database URL" for same-region services

---

## Step 3: Create Web Service

1. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub account (if not already)
   - Select your repository
   - Click "Connect"

2. **Configure Service:**
   - **Name:** `fashion-designer-app` (or any name)
   - **Region:** Same as your database (important!)
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** Leave empty (root of repo)
   - **Runtime:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (or Starter for production)

3. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable"
   
   Add these variables:
   ```
   DATABASE_URL = <paste-internal-database-url-from-step-2>
   NODE_ENV = production
   PORT = 3000
   SESSION_SECRET = <generate-random-secret>
   ```

4. **Generate SESSION_SECRET:**
   Run this command in your terminal:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and use it as SESSION_SECRET

5. **Click "Create Web Service"**

---

## Step 4: Initial Deployment

1. **Wait for Build:**
   - Render will start building automatically
   - Watch the build logs
   - First build takes 3-5 minutes

2. **Check Build Logs:**
   - If build fails, check the logs
   - Common issues:
     - Missing environment variables
     - Build command errors
     - Database connection issues

---

## Step 5: Push Database Schema

After the first successful deployment:

1. **Open Render Shell:**
   - Go to your web service
   - Click "Shell" tab (or use "Manual Deploy" → "Run Command")
   - Or use Render's web terminal

2. **Run Database Migration:**
   ```bash
   npm run db:push
   ```

3. **Seed Initial Data (Optional):**
   ```bash
   npx tsx server/seed.ts
   ```

**Alternative Method (Using Render's Manual Deploy):**
- Go to your service → "Manual Deploy"
- Select "Run Command"
- Enter: `npm run db:push`
- Click "Run"

---

## Step 6: Access Your App

1. **Get Your App URL:**
   - Render provides a URL like: `https://your-app-name.onrender.com`
   - Find it in your service dashboard

2. **Test Your App:**
   - Visit the URL in your browser
   - Login with your credentials:
     - Email: `rajiya0121@gmail.com`
     - Password: `rajiya@0121`
   - Or use: `designer@atelier.com` / `password123`

---

## Step 7: Configure Auto-Deploy (Optional)

Render automatically deploys on every push to your main branch by default.

To configure:
- Go to your service → "Settings"
- "Auto-Deploy" should be enabled
- Branch: `main`

---

## 🔧 Important Configuration Notes

### Free Tier Limitations:
- ⚠️ **Spins down after 15 minutes of inactivity**
- First request after spin-down takes 30-60 seconds (cold start)
- For production, consider Starter plan ($7/month) for always-on

### Database Connection:
- Use **Internal Database URL** when service and database are in same region
- Use **External Database URL** only if needed (less secure, slower)

### File Storage:
- Render provides persistent disk storage
- Your `uploads/` folder will persist
- Consider using cloud storage (S3, Cloudinary) for production

### Environment Variables:
Make sure these are set:
- ✅ `DATABASE_URL` - From your PostgreSQL service
- ✅ `NODE_ENV=production`
- ✅ `PORT=3000` (Render sets this automatically, but good to have)
- ✅ `SESSION_SECRET` - Random secure string

---

## 🐛 Troubleshooting

### Build Fails:
1. Check build logs for errors
2. Verify `package.json` has correct build script
3. Ensure all dependencies are in `dependencies` (not just `devDependencies`)

### Database Connection Error:
1. Verify `DATABASE_URL` is correct
2. Check database is in same region as service
3. Use Internal Database URL (not External)
4. Ensure database is running (not paused)

### App Won't Start:
1. Check start command: `npm start`
2. Verify `dist/index.cjs` exists after build
3. Check logs for runtime errors
4. Ensure PORT environment variable is set

### 502 Bad Gateway:
- Usually means app crashed
- Check logs for errors
- Verify database connection
- Check if all environment variables are set

### Slow First Load:
- Normal on free tier (cold start)
- Upgrade to Starter plan for always-on

---

## 📊 Monitoring

1. **View Logs:**
   - Service → "Logs" tab
   - Real-time logs
   - Search and filter logs

2. **Metrics:**
   - Service → "Metrics" tab
   - CPU, Memory usage
   - Request metrics

---

## 🔄 Updating Your App

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Update app"
   git push origin main
   ```

2. **Render Auto-Deploys:**
   - Render detects the push
   - Automatically starts new build
   - Deploys when build succeeds

3. **Manual Deploy (if needed):**
   - Service → "Manual Deploy"
   - Select branch/commit
   - Click "Deploy"

---

## 💰 Pricing

### Free Tier:
- Web Service: Free (spins down after inactivity)
- PostgreSQL: Free (90 days, then $7/month)
- Good for: Development, testing

### Starter Plan:
- Web Service: $7/month (always-on)
- PostgreSQL: $7/month
- Total: ~$14/month
- Good for: Small production apps

---

## ✅ Deployment Checklist

Before going live:
- [ ] Database created and running
- [ ] All environment variables set
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Seed data created (optional)
- [ ] App builds successfully
- [ ] App starts without errors
- [ ] Can login successfully
- [ ] File uploads work
- [ ] Database persists data

---

## 🎉 You're Live!

Your Fashion Designer Platform is now deployed and accessible worldwide!

**Next Steps:**
1. Test all features
2. Share your URL with clients
3. Monitor logs for any issues
4. Consider upgrading to Starter plan for production

---

## 📞 Need Help?

- Render Docs: https://render.com/docs
- Render Support: support@render.com
- Check deployment logs for specific errors

**Good luck with your deployment! 🚀**

