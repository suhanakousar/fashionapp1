# 🚀 Quick Deployment Checklist for Render

## Pre-Deployment Setup

### 1. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
- [ ] Create a free M0 cluster
- [ ] Create database user (username + password)
- [ ] Configure Network Access (allow 0.0.0.0/0 for development, or Render IPs)
- [ ] Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/fashiondb`

### 2. Environment Variables to Set in Render

When creating your web service, add these environment variables:

```
DATABASE_URL = mongodb+srv://username:password@cluster.mongodb.net/fashiondb?retryWrites=true&w=majority
NODE_ENV = production
PORT = 3000
SESSION_SECRET = 073dfb0a5524bc8e582fae3049456ecac806c932387443b7d77d617fe0a36b25
```

**Note:** Replace the DATABASE_URL with your actual MongoDB Atlas connection string.

### 3. Render Service Configuration

**Service Type:** Web Service  
**Build Command:** `npm install && npm run build`  
**Start Command:** `npm start`  
**Plan:** Free (or Starter for production)

### 4. After First Deployment

1. Check build logs for any errors
2. Once deployed, test the app URL
3. (Optional) Run seed script via Render Shell:
   ```bash
   npm run seed
   ```

## Quick Steps Summary

1. ✅ Code is on GitHub (already done)
2. ⬜ Set up MongoDB Atlas
3. ⬜ Create Render Web Service
4. ⬜ Add environment variables
5. ⬜ Deploy and test

## Your Generated SESSION_SECRET

```
073dfb0a5524bc8e582fae3049456ecac806c932387443b7d77d617fe0a36b25
```

Save this securely - you'll need it for the SESSION_SECRET environment variable.

## Need Help?

See `RENDER_DEPLOY.md` for detailed step-by-step instructions.

