# Progressive Web App (PWA) Setup

This project is configured as a PWA. It includes:

- `client/public/manifest.json` (app name, icons, theme)
- `client/public/sw.js` (service worker, offline caching)
- Install prompt support (beforeinstallprompt)
- PWA Install Button component

## What's Already Done

✅ Manifest.json created  
✅ Service worker (sw.js) created  
✅ Service worker registration added to main.tsx  
✅ PWA meta tags added to index.html  
✅ Install button component created and added to PublicLayout  
✅ Icons directory structure created  

## What You Need to Do

### 1. Generate and Add Icons

You need to create icon files and place them in `client/public/icons/`:

**Required minimum:**
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

**Recommended (all sizes):**
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-384x384.png`
- `apple-startup.png` (for iOS, recommended: 2048x2732)

**How to generate:**
1. Use [PWABuilder](https://pwabuilder.com) - upload your logo and download the icon set
2. Use [RealFaviconGenerator](https://realfavicongenerator.net) - upload your logo and configure
3. Or manually create square PNG images and resize to each size

### 2. Test Locally

1. Build the app: `npm run build`
2. Serve it: `npx serve -s dist/public` (or use your preferred static server)
3. Open Chrome DevTools → Application → Manifest
   - Check "Is mobile friendly" and "Has a service worker"
4. In DevTools → Application → Service Workers: verify SW is registered
5. Test offline: DevTools → Network → Offline → reload → app should load from cache

### 3. Deploy to Render

1. Commit and push your changes:
   ```bash
   git add client/public/manifest.json client/public/sw.js client/public/icons/*
   git commit -m "Add PWA manifest and service worker"
   git push origin main
   ```

2. Render will auto-deploy

3. After deployment, test installability:
   - **Android (Chrome)**: The install prompt should appear automatically or via the install button
   - **iOS (Safari)**: Users need to manually "Add to Home Screen" via Share → Add to Home Screen

## Features

- **Offline Support**: App works offline with cached assets
- **Install Prompt**: Users can install the app on their devices
- **Fast Loading**: Assets are cached for faster subsequent loads
- **Network-First Navigation**: Always gets fresh content when online
- **Cache-First Assets**: Static assets load from cache for speed

## Updating the Cache

When you release a new version, update the `CACHE_NAME` in `client/public/sw.js`:

```javascript
const CACHE_NAME = 'atelier-cache-v2'; // Increment version number
```

This ensures users get the latest version of your app.

## Troubleshooting

**SW not registering:**
- Ensure `sw.js` is served from root (`/sw.js`)
- Check that you're using HTTPS (or localhost for testing)
- Verify the service worker path in main.tsx matches the file location

**Install prompt not appearing:**
- Ensure manifest.json is valid
- Check that you have at least icon-192x192.png and icon-512x512.png
- Verify the site is served over HTTPS
- Test in Chrome on Android for best results

**Icons not showing:**
- Verify icon files exist in `client/public/icons/`
- Check paths in manifest.json match actual file locations
- Ensure icons are valid PNG files

**App loads but assets are stale:**
- Update CACHE_NAME in sw.js to force cache refresh
- Clear browser cache and reinstall the PWA

## iOS Specific Notes

iOS has some limitations:
- No `beforeinstallprompt` event (install button won't show automatically)
- Users must manually add to home screen via Safari → Share → Add to Home Screen
- Service worker push notifications are not supported
- Offline support works but with some limitations

The Apple-specific meta tags are already added to index.html for better iOS support.

