# 🔧 Render Environment Variables Setup

## ✅ Variables You Already Have (Map These)

| Your Variable | Backend Needs | Value |
|--------------|---------------|-------|
| `DATABASE_URL` | `MONGO_URI` | `mongodb+srv://fashiondb:suhana2005@cluster0.eong0i3.mongodb.net/fashiondb?retryWrites=true&w=majority` |
| `CLOUDINARY_CLOUD_NAME` | `CLOUDINARY_CLOUD_NAME` | `dzxawjlvs` ✅ |
| `CLOUDINARY_API_KEY` | `CLOUDINARY_API_KEY` | `893663778162643` ✅ |
| `CLOUDINARY_API_SECRET` | `CLOUDINARY_API_SECRET` | `_ThzqgrXbg3IHRlqhSJll92P7_w` ✅ |
| `SESSION_SECRET` | `SECRET_KEY` | `073dfb0a5524bc8e582fae3049456ecac806c932387443b7d77d617fe0a36b25` |

## ➕ Variables You Need to ADD

### 1. MONGO_URI (Rename DATABASE_URL)
- **Name**: `MONGO_URI`
- **Value**: `mongodb+srv://fashiondb:suhana2005@cluster0.eong0i3.mongodb.net/fashiondb?retryWrites=true&w=majority`
- (Same as your DATABASE_URL)

### 2. REDIS_URL (Required - Add Redis Service First!)
**IMPORTANT**: You need to create a Redis service first!

1. In Render dashboard, click **"New +"** → **"Redis"**
2. Name: `styleweave-redis`
3. Plan: Free
4. Click **"Create Redis"**
5. After creation, copy the **Internal Redis URL**
6. Add as environment variable:
   - **Name**: `REDIS_URL`
   - **Value**: `redis://...` (from Redis service)

### 3. CLOUDINARY_FOLDER
- **Name**: `CLOUDINARY_FOLDER`
- **Value**: `styleweave`

### 4. CORS_ORIGINS (Your Frontend URL)
- **Name**: `CORS_ORIGINS`
- **Value**: `https://rajiyafashion-deyabyvz3-suhanakousars-projects.vercel.app`
- (No trailing slash!)

### 5. ACCESS_TOKEN_EXPIRE_MINUTES
- **Name**: `ACCESS_TOKEN_EXPIRE_MINUTES`
- **Value**: `60`

### 6. SECRET_KEY (Use Your SESSION_SECRET)
- **Name**: `SECRET_KEY`
- **Value**: `073dfb0a5524bc8e582fae3049456ecac806c932387443b7d77d617fe0a36b25`
- (Same as your SESSION_SECRET)

## ❌ Variables You Can Remove (Not Needed)
- `CLOUDINARY_URL` (we use individual keys)
- `PORT` (Render sets this automatically)
- `NODE_ENV` (not needed for Python)

## 📋 Complete Environment Variables List

Add these to your Render web service:

```
MONGO_URI=mongodb+srv://fashiondb:suhana2005@cluster0.eong0i3.mongodb.net/fashiondb?retryWrites=true&w=majority
REDIS_URL=redis://... (get from Redis service)
CLOUDINARY_CLOUD_NAME=dzxawjlvs
CLOUDINARY_API_KEY=893663778162643
CLOUDINARY_API_SECRET=_ThzqgrXbg3IHRlqhSJll92P7_w
CLOUDINARY_FOLDER=styleweave
CORS_ORIGINS=https://rajiyafashion-deyabyvz3-suhanakousars-projects.vercel.app
SECRET_KEY=073dfb0a5524bc8e582fae3049456ecac806c932387443b7d77d617fe0a36b25
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## 🚀 Quick Steps

1. **Create Redis Service** (if not done)
   - New + → Redis → Free → Create
   - Copy Internal Redis URL

2. **In Web Service Settings**:
   - Go to "Environment" tab
   - Add all variables above
   - Save

3. **Deploy!**

