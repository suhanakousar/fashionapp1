# Vercel Deployment Quick Start

## Quick Steps

### 1. Deploy Backend
1. Go to https://vercel.com/new
2. Import `suhanakousar/fashionapp1`
3. Project name: `fashionapp-backend`
4. **Root Directory**: **Set to `.` (root)** - This is CRITICAL! It tells Vercel to use the repository root where all folders are located
5. Framework: **Other**
6. Build Command: `npm install` (or leave empty)
7. Output Directory: Leave empty
8. Environment Variables:
   - `DATABASE_URL` = Your MongoDB connection string
   - `SESSION_SECRET` = Random secret (generate: `openssl rand -base64 32`)
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = (Set after frontend deploys)
9. **Before deploying**: 
   - Verify Root Directory is set to `.` in Settings → General
   - Rename `vercel-backend.json` to `vercel.json` OR configure in dashboard
10. Deploy and copy the URL (e.g., `https://fashionapp-backend.vercel.app`)

### 2. Deploy Frontend
1. Go to https://vercel.com/new
2. Import `suhanakousar/fashionapp1` (same repo)
3. Project name: `fashionapp-frontend`
4. **Root Directory**: **Set to `.` (root)** - Same as backend, use repository root
5. Framework: **Vite**
6. Build Command: `npm run build`
7. Output Directory: `dist/public`
8. Environment Variables:
   - `VITE_API_URL` = Your backend URL from step 1 (e.g., `https://fashionapp-backend.vercel.app`)
   - `NODE_ENV` = `production`
9. **Before deploying**: 
   - Verify Root Directory is set to `.` in Settings → General
   - Rename `vercel-frontend.json` to `vercel.json` OR configure in dashboard
10. Deploy and copy the URL (e.g., `https://fashionapp-frontend.vercel.app`)

### 3. Link Them Together
1. Go back to backend project in Vercel
2. Settings → Environment Variables
3. Add/Update `FRONTEND_URL` = Your frontend URL from step 2
4. Redeploy backend

### 4. Test
- Visit frontend URL
- Try logging in
- Check browser console for errors

## Important Notes

⚠️ **File Uploads**: Vercel serverless functions have a 4.5MB payload limit. For production file uploads, consider using:
- Vercel Blob Storage
- AWS S3
- Cloudinary
- Or keep files in MongoDB GridFS

⚠️ **Database**: Make sure your MongoDB Atlas IP whitelist includes `0.0.0.0/0` or Vercel's IP ranges.

## Troubleshooting

- **CORS errors**: Make sure `FRONTEND_URL` is set in backend env vars
- **Session not working**: Check that cookies are enabled and `sameSite: "none"` is set (already configured)
- **Build fails**: Check Vercel build logs for specific errors

