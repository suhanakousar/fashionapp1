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

## Step 2: Set Up MongoDB Database

Your app uses MongoDB. You have two options:

### Option A: MongoDB Atlas (Recommended - Free Tier Available)

1. **Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**

2. **Create Free Cluster:**
   - Sign up or log in
   - Click "Create" → "Cluster"
   - Choose "M0 FREE" (Free tier)
   - Select a cloud provider and region (choose closest to your Render region)
   - Click "Create Cluster"

3. **Set Up Database Access:**
   - Go to "Database Access" → "Add New Database User"
   - Create username and password (save these!)
   - Set privileges to "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access:**
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for Render
   - Or add Render's IP ranges (check Render docs)
   - Click "Confirm"

5. **Get Connection String:**
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `fashiondb` (or your preferred database name)
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fashiondb?retryWrites=true&w=majority`

### Option B: Use Existing MongoDB Database

If you already have a MongoDB connection string, use that.

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
   - **Build Command:** `rm -rf node_modules && npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (or Starter for production)

3. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable"
   
   Add these variables:
   ```
   DATABASE_URL = <paste-mongodb-connection-string-from-step-2>
   NODE_ENV = production
   PORT = 3000
   SESSION_SECRET = <generate-random-secret>
   ```
   
   **Important:** 
   - `DATABASE_URL` should be your full MongoDB Atlas connection string
   - Make sure to replace `<password>` and `<dbname>` in the connection string

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

## Step 5: Initialize Database (Optional)

MongoDB doesn't require schema migrations like SQL databases. However, if you have seed data:

1. **Open Render Shell:**
   - Go to your web service
   - Click "Shell" tab (or use "Manual Deploy" → "Run Command")

2. **Seed Initial Data (Optional):**
   ```bash
   npm run seed
   ```
   
   **Note:** MongoDB creates collections automatically when you first insert data, so no migration step is needed.

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
- MongoDB Atlas connection strings work from anywhere
- Make sure your MongoDB Atlas network access allows Render's IPs (or use 0.0.0.0/0 for development)
- For production, consider restricting IP access to Render's IP ranges

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
1. Verify `DATABASE_URL` is correct (check password and database name)
2. Ensure MongoDB Atlas cluster is running
3. Check Network Access in MongoDB Atlas allows your IP/Render IPs
4. Verify database user credentials are correct
5. Check MongoDB Atlas connection string format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

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
- MongoDB Atlas: Free (M0 cluster - 512MB storage)
- Good for: Development, testing

### Starter Plan:
- Web Service: $7/month (always-on)
- MongoDB Atlas: Free tier available, or $9/month for M10 cluster
- Total: ~$7-16/month
- Good for: Small production apps

---

## ✅ Deployment Checklist

Before going live:
- [ ] MongoDB Atlas cluster created and running
- [ ] Database user created with proper permissions
- [ ] Network access configured (IP whitelist)
- [ ] All environment variables set (DATABASE_URL, SESSION_SECRET, etc.)
- [ ] Seed data created (optional - `npm run seed`)
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

