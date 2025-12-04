# Deployment Guide: Frankenstein Fusion Outfit Designer

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)
- Vercel account (free tier)
- HuggingFace account (optional, for API access)

---

## Environment Variables

### Required Variables

```env
# MongoDB
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# Session
SESSION_SECRET=your-random-secret-key-here

# Cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
# OR
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend API URL
VITE_API_URL=https://your-api.vercel.app
```

### Optional Variables

```env
# HuggingFace (uses local mock if not set)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx

# Face masking policy
AUTO_MASK_FACES=true  # Set to true to auto-mask faces, false to require consent

# WhatsApp (if using)
WHATSAPP_PROVIDER=url  # or "twilio" or "whatsapp-api"
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=...
```

---

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=mongodb+srv://...
SESSION_SECRET=dev-secret-key
CLOUDINARY_URL=cloudinary://...
NODE_ENV=development
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

---

## Vercel Deployment

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Vercel will auto-detect the project settings

### 2. Configure Build Settings

Vercel should auto-detect:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### 3. Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

Add all required variables (see above).

**Important**: Set variables for both "Production" and "Preview" environments.

### 4. Deploy

Click "Deploy" and wait for the build to complete.

### 5. Update Frontend API URL

After deployment, update `VITE_API_URL` in Vercel environment variables to point to your deployed API URL.

---

## MongoDB Atlas Setup

### 1. Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0)
3. Choose a cloud provider and region

### 2. Configure Network Access

1. Go to "Network Access"
2. Add IP address: `0.0.0.0/0` (for Vercel) or your specific IPs
3. Click "Add IP Address"

### 3. Create Database User

1. Go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and password (save these!)
5. Grant "Atlas Admin" role
6. Click "Add User"

### 4. Get Connection String

1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Use this as `DATABASE_URL`

---

## Cloudinary Setup

### 1. Create Account

1. Go to [Cloudinary](https://cloudinary.com)
2. Sign up for free account
3. Verify email

### 2. Get Credentials

1. Go to Dashboard
2. Copy "Cloudinary URL" from the dashboard
3. Use this as `CLOUDINARY_URL` environment variable

Or extract individual values:
- Cloud Name
- API Key
- API Secret

### 3. Configure Upload Presets (Optional)

1. Go to Settings → Upload
2. Create upload preset for fusion images
3. Set folder: `fusion/uploads`
4. Set quality: `auto:best`

---

## HuggingFace Setup (Optional)

### 1. Create Account

1. Go to [HuggingFace](https://huggingface.co)
2. Sign up for free account
3. Verify email

### 2. Get API Token

1. Go to Settings → Access Tokens
2. Create new token
3. Copy token
4. Use as `HUGGINGFACE_API_KEY`

### 3. Note on Free Tier

- Rate-limited API calls
- May need to wait for model to load
- Consider using local mock mode for development

---

## Post-Deployment Checklist

### 1. Test API Endpoints

```bash
# Test upload
curl -X POST https://your-api.vercel.app/api/fusion/upload \
  -F "images=@test-image.jpg"

# Test create job
curl -X POST https://your-api.vercel.app/api/fusion/create \
  -H "Content-Type: application/json" \
  -d '{"imageA":"url1","imageB":"url2","mode":"pattern","strength":0.7}'
```

### 2. Test Frontend

1. Visit deployed frontend URL
2. Navigate to `/fusion`
3. Upload test images
4. Create fusion job
5. Verify results

### 3. Monitor Logs

- Vercel Dashboard → Functions → View Logs
- Check for errors in API calls
- Monitor Cloudinary usage
- Check MongoDB connection

### 4. Set Up Monitoring (Optional)

- Vercel Analytics (built-in)
- Sentry for error tracking
- LogRocket for session replay

---

## Troubleshooting

### Issue: "Database connection failed"

**Solution**:
- Check `DATABASE_URL` is correct
- Verify MongoDB network access allows `0.0.0.0/0`
- Check database user credentials

### Issue: "Cloudinary upload failed"

**Solution**:
- Verify `CLOUDINARY_URL` is correct
- Check Cloudinary account limits (free tier: 25GB)
- Verify API key permissions

### Issue: "HuggingFace API error"

**Solution**:
- Check `HUGGINGFACE_API_KEY` is set
- Verify API token is valid
- Check rate limits (may need to wait)
- Use mock mode for development (`USE_MOCK=true`)

### Issue: "Fusion job stuck in processing"

**Solution**:
- Check Vercel function logs
- Verify HuggingFace API is responding
- Check MongoDB connection
- Review `fusionPipeline.ts` error handling

### Issue: "Faces detected error"

**Solution**:
- Set `AUTO_MASK_FACES=true` to auto-mask
- Or implement consent flow in frontend
- Or use images without faces for testing

---

## Free Tier Limits

### MongoDB Atlas (M0 Free Tier)
- 512MB storage
- Shared RAM/CPU
- No backup (upgrade for backups)

### Cloudinary (Free Tier)
- 25GB storage
- 25GB bandwidth/month
- 25GB transformations/month

### Vercel (Free Tier)
- 100GB bandwidth/month
- Unlimited requests (with limits)
- 100 serverless function executions/day (hobby)

### HuggingFace (Free Tier)
- Rate-limited API
- Model loading time
- No guaranteed uptime

---

## Scaling Considerations

### When to Upgrade

1. **MongoDB**: When storage exceeds 512MB
2. **Cloudinary**: When bandwidth exceeds 25GB/month
3. **Vercel**: When function executions exceed limits
4. **HuggingFace**: For production, consider self-hosting models

### Optimization Tips

1. **Image Optimization**: Use Cloudinary transformations
2. **Caching**: Cache fusion results
3. **Queue System**: Use job queue for high volume
4. **CDN**: Cloudinary provides CDN automatically
5. **Database Indexing**: Index `jobId` in `fusion_jobs` collection

---

## Security Checklist

- [ ] All API keys in environment variables (not in code)
- [ ] `SESSION_SECRET` is random and secure
- [ ] MongoDB network access restricted (if possible)
- [ ] Cloudinary upload restrictions set
- [ ] Face detection policy documented
- [ ] Rate limiting enabled on upload endpoints
- [ ] CORS configured correctly
- [ ] HTTPS enabled (Vercel default)

---

## Support

For issues or questions:
1. Check Vercel function logs
2. Review MongoDB Atlas logs
3. Check Cloudinary dashboard
4. Review `.kiro` folder for specifications
5. See `HOW_KIRO_HELPED.md` for implementation details

---

**Last Updated**: 2024
**Version**: 1.0.0

