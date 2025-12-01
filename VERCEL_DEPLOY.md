# Vercel Deployment Guide

This guide will help you deploy both the backend and frontend to Vercel separately, then link them together.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. MongoDB database connection string (from MongoDB Atlas or your MongoDB instance)
4. Git repository pushed to GitHub (already done: https://github.com/suhanakousar/fashionapp1.git)

## Step 1: Deploy Backend to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository: `suhanakousar/fashionapp1`
3. Configure the project:
   - **Project Name**: `fashionapp-backend` (or your preferred name)
   - **Root Directory**: **IMPORTANT - Set to `.` (root directory)** - This is the current directory where `package.json`, `server/`, `api/`, and other folders are located
   - **Framework Preset**: Other
   - **Build Command**: `npm install` (or leave empty - Vercel will auto-detect)
   - **Output Directory**: Leave empty (not used for serverless functions)
   - **Install Command**: `npm install` (or leave empty - Vercel will auto-detect)

4. **IMPORTANT**: In the Vercel dashboard, go to **Settings → General** and verify:
   - **Root Directory**: Should be `.` (this means the root of the repository)
   - This ensures Vercel can find `api/index.ts`, `server/`, `package.json`, etc.

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add the following:
     - `DATABASE_URL`: Your MongoDB connection string
     - `SESSION_SECRET`: A random secret string (generate one: `openssl rand -base64 32`)
     - `NODE_ENV`: `production`
     - `PORT`: `3000` (optional, Vercel will set this automatically)
     - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name (e.g., `dzxawjlvs`)
     - `CLOUDINARY_API_KEY`: Your Cloudinary API key (e.g., `893663778162643`)
     - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret (e.g., `_ThzqgrXbg3IHRlqhSJll92P7_w`)
     - **OR** use `CLOUDINARY_URL`: `cloudinary://api_key:api_secret@cloud_name` (alternative format)

6. **Important**: Before deploying, you have two options:
   
   **Option 1**: Rename `vercel-backend.json` to `vercel.json` in your repository
   
   **Option 2**: Keep the files separate and configure in Vercel dashboard:
   - Go to Settings → General
   - Under "Build & Development Settings", you can override the configuration
   - Or upload `vercel-backend.json` as the configuration file

7. Click "Deploy"

8. Wait for deployment to complete and note the deployment URL (e.g., `https://fashionapp-backend.vercel.app`)

**Note**: The root directory (`.`) means Vercel will look for files in the repository root, where you have:
- `api/index.ts` (serverless function entry point)
- `server/` (backend code)
- `package.json` (dependencies)
- All other project files

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy backend
# First, temporarily rename vercel.json to vercel-full.json
mv vercel.json vercel-full.json
mv vercel-backend.json vercel.json

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
vercel env add NODE_ENV production

# Restore original vercel.json
mv vercel.json vercel-backend.json
mv vercel-full.json vercel.json
```

## Step 2: Deploy Frontend to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import the same GitHub repository: `suhanakousar/fashionapp1`
3. Configure the project:
   - **Project Name**: `fashionapp-frontend` (or your preferred name)
   - **Root Directory**: Leave as `.` (root)
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

4. Add Environment Variables:
   - Click "Environment Variables"
   - Add the following:
     - `VITE_API_URL`: Your backend URL from Step 1 (e.g., `https://fashionapp-backend.vercel.app`)
     - `NODE_ENV`: `production`

5. **Important**: Rename `vercel-frontend.json` to `vercel.json` in your repository, or configure in dashboard:
   - In Vercel dashboard, go to Settings → General
   - Under "Build & Development Settings", set:
     - Build Command: `npm run build`
     - Output Directory: `dist/public`
     - Framework: Vite

6. Click "Deploy"

7. Wait for deployment to complete and note the deployment URL (e.g., `https://fashionapp-frontend.vercel.app`)

### Option B: Using Vercel CLI

```bash
# Deploy frontend
# First, temporarily rename vercel.json
mv vercel.json vercel-full.json
mv vercel-frontend.json vercel.json

# Deploy
vercel --prod

# Set environment variables (replace with your backend URL)
vercel env add VITE_API_URL https://your-backend-url.vercel.app
vercel env add NODE_ENV production

# Restore original vercel.json
mv vercel.json vercel-frontend.json
mv vercel-full.json vercel.json
```

## Step 3: Update CORS and Session Settings

After deploying, you need to set the `FRONTEND_URL` environment variable in your backend Vercel project:

1. Go to your backend project in Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add `FRONTEND_URL` with your frontend URL (e.g., `https://fashionapp-frontend.vercel.app`)
4. Redeploy the backend

The CORS and session settings are already configured in `server/routes.ts` to work with cross-origin requests when `FRONTEND_URL` is set.

## Step 4: Test the Deployment

1. Visit your frontend URL (e.g., `https://fashionapp-frontend.vercel.app`)
2. Try logging in with your admin credentials
3. Check browser console for any CORS or API errors
4. Verify that API calls are going to the correct backend URL

## Troubleshooting

### CORS Errors

If you see CORS errors, add CORS middleware to your backend:

```typescript
// In server/routes.ts, add at the top:
import cors from 'cors';

// Then in registerRoutes function:
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-frontend-url.vercel.app',
  credentials: true
}));
```

### Session Not Working

Update session configuration in `server/routes.ts`:

```typescript
cookie: {
  secure: true, // Must be true for HTTPS
  httpOnly: true,
  sameSite: "none", // Required for cross-origin
  maxAge: 24 * 60 * 60 * 1000,
}
```

### Environment Variables Not Working

- Make sure environment variables are set in Vercel dashboard
- For frontend, variables must start with `VITE_` to be accessible in the browser
- Redeploy after adding/changing environment variables

### Build Errors

- Check that all dependencies are in `package.json`
- Ensure build command is correct
- Check Vercel build logs for specific errors

## Alternative: Single Deployment

If you prefer to deploy everything together in one Vercel project:

1. Use the main `vercel.json` file
2. Deploy once
3. Both API and frontend will be available on the same domain
4. No need to set `VITE_API_URL` (will use relative paths)

## Next Steps

- Set up custom domains in Vercel dashboard
- Configure automatic deployments from GitHub
- Set up monitoring and error tracking
- Configure database backups

