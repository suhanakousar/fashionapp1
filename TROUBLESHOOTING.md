# 🔧 Troubleshooting - Loading Screen Stuck

If your app is stuck on "Loading StyleWeave AI...", follow these steps:

## 1. Check Browser Console

**Open Developer Tools:**
- Press `F12` or `Right-click → Inspect`
- Go to **Console** tab
- Look for **red error messages**

Common errors:
- `Failed to fetch` - Network issue
- `Cannot find module` - Missing dependency
- `Unexpected token` - Syntax error
- `CORS error` - Backend connection issue

## 2. Check Network Tab

1. Open **Network** tab in Developer Tools
2. Refresh the page
3. Look for **failed requests** (red entries)
4. Check if `main.tsx` or other JS files are loading

## 3. Common Fixes

### Fix 1: Clear Browser Cache
```
1. Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
2. Select "Cached images and files"
3. Clear data
4. Refresh page
```

### Fix 2: Check Vercel Build Logs
1. Go to Vercel Dashboard
2. Click on your deployment
3. Check **Build Logs** for errors
4. Look for failed build steps

### Fix 3: Check Environment Variables
1. Vercel Dashboard → Settings → Environment Variables
2. Make sure `VITE_API_URL` is set (if using backend)
3. Redeploy after adding variables

### Fix 4: Check Root Directory
1. Vercel Dashboard → Settings → General
2. **Root Directory** should be: `vercel-deploy`
3. Save and redeploy

## 4. Test Locally

Run the app locally to see if it works:

```bash
cd vercel-deploy
npm install
npm run dev
```

If it works locally but not on Vercel:
- Check build configuration
- Check for environment-specific code
- Check Vercel build logs

## 5. Check for Missing Files

Make sure these files exist:
- ✅ `vercel-deploy/src/main.tsx`
- ✅ `vercel-deploy/src/App.tsx`
- ✅ `vercel-deploy/index.html`
- ✅ `vercel-deploy/package.json`
- ✅ `vercel-deploy/vite.config.ts`

## 6. Check Import Paths

All imports should use:
- `./` for same directory
- `../` for parent directory
- `@/` for src directory (configured in vite.config.ts)

## 7. Force Redeploy

1. Vercel Dashboard → Deployments
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait for build to complete

## 8. Still Stuck?

If none of the above works:

1. **Share the console error** - Copy the exact error message
2. **Check Vercel build logs** - Look for build failures
3. **Test a minimal version** - Create a simple "Hello World" React app to test

## Quick Test

Open browser console and type:
```javascript
console.log("Test");
```

If this works, JavaScript is loading. The issue is likely in React initialization.

