# How to Clear Service Worker and Fix Login Issue

The "Unexpected token '<', "<!DOCTYPE" is not valid JSON" error means the API is returning HTML instead of JSON. This is usually caused by a cached service worker.

## Quick Fix Steps:

### 1. Unregister Service Worker (Chrome/Edge)

1. Open your app in the browser
2. Press **F12** to open DevTools
3. Go to **Application** tab (or **Storage** in Firefox)
4. Click **Service Workers** in the left sidebar
5. Find your service worker and click **Unregister**
6. Go to **Cache Storage** in the left sidebar
7. Right-click on `atelier-cache-v1` or `atelier-cache-v2` and click **Delete**
8. Close DevTools
9. **Hard refresh** the page:
   - Windows: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

### 2. Alternative: Clear All Site Data

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage** in the left sidebar
4. Check all boxes
5. Click **Clear site data**
6. Reload the page

### 3. Verify Server is Running

Make sure your dev server is running:
```bash
npm run dev
```

You should see:
```
Successfully connected to MongoDB
serving on port 3000
```

### 4. Test the API Directly

Open browser console and test:
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'rajiya0121@gmail.com', password: 'rajiya@0121' })
}).then(r => r.text()).then(console.log)
```

If you see HTML instead of JSON, the service worker is still intercepting.

### 5. Disable Service Worker Temporarily

If the above doesn't work, you can temporarily disable the service worker:

1. Open `client/src/main.tsx`
2. Comment out the service worker registration:
```typescript
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then(reg => console.log('SW registered:', reg.scope))
//       .catch(err => console.log('SW registration failed:', err));
//   });
// }
```

3. Restart the dev server
4. Clear browser cache and try again

### 6. Check Network Tab

1. Open DevTools → **Network** tab
2. Try to login
3. Look for the `/api/auth/login` request
4. Check:
   - **Status**: Should be 200 (not 304 or cached)
   - **Type**: Should be `xhr` or `fetch`
   - **Response**: Should be JSON, not HTML
   - **Size**: Should show actual size, not "(from cache)"

If it shows "(from cache)" or "(from ServiceWorker)", the service worker is still intercepting.

## After Fixing

Once login works, you can re-enable the service worker. The updated version (v2) should not intercept API requests.

