# 🐛 Debug Upload Issues

## Problem: Uploads not showing in Render logs

If uploads aren't appearing in Render logs, check:

### 1. Check Frontend Environment Variable

**In Vercel:**
1. Go to Settings → Environment Variables
2. Verify `VITE_API_URL` is set to: `https://fashionapp1.onrender.com`
3. **Important**: Redeploy after adding/updating env vars!

### 2. Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try uploading a file
4. Look for:
   - API calls to `https://fashionapp1.onrender.com`
   - CORS errors
   - Network errors

### 3. Check Network Tab

1. Open **Network** tab in DevTools
2. Filter by "XHR" or "Fetch"
3. Try uploading a file
4. Look for requests to:
   - `https://fashionapp1.onrender.com/v1/upload`
5. Check:
   - Status code (should be 200)
   - Request/Response details
   - Any errors

### 4. Check Backend CORS

**In Render:**
1. Go to Environment tab
2. Check `CORS_ORIGINS` includes: `https://fashionapp1.vercel.app`
3. No trailing slash!

### 5. Test Backend Directly

Open in browser:
- `https://fashionapp1.onrender.com/health` → Should return `{"status": "healthy"}`
- `https://fashionapp1.onrender.com/docs` → Should show API docs

### 6. Test Upload Endpoint

Use browser console or Postman:
```javascript
const formData = new FormData();
formData.append('file', file); // your file
formData.append('type', 'model');

fetch('https://fashionapp1.onrender.com/v1/upload', {
  method: 'POST',
  body: formData
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### 7. Check Render Logs

1. Go to Render Dashboard → Your service → **Logs**
2. Look for:
   - Incoming requests
   - Errors
   - Upload processing

## Common Issues

### Issue 1: CORS Error
**Error**: `Access to fetch at '...' has been blocked by CORS policy`

**Fix**: 
- Check `CORS_ORIGINS` in Render includes frontend URL
- Format: `https://fashionapp1.vercel.app` (no trailing slash)

### Issue 2: 404 Not Found
**Error**: `404` when calling `/v1/upload`

**Fix**:
- Check backend is running
- Check route is registered: `app.include_router(upload.router, prefix="/v1")`

### Issue 3: 500 Internal Server Error
**Error**: `500` from backend

**Fix**:
- Check Render logs for error details
- Check environment variables (MONGO_URI, CLOUDINARY_*)
- Check Cloudinary credentials

### Issue 4: Request Never Sent
**Symptom**: No network request appears in Network tab

**Fix**:
- Check `VITE_API_URL` is set in Vercel
- Check frontend code is using `import.meta.env.VITE_API_URL`
- Redeploy frontend after setting env var

## Quick Test

Run this in browser console on your frontend:

```javascript
// Test API connection
fetch('https://fashionapp1.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Should return: {status: "healthy"}
```

If this fails, there's a connection issue.

