# PWA Icons

This directory should contain the following icon files for the Progressive Web App:

- `icon-72x72.png` (72x72 pixels)
- `icon-96x96.png` (96x96 pixels)
- `icon-128x128.png` (128x128 pixels)
- `icon-144x144.png` (144x144 pixels)
- `icon-152x152.png` (152x152 pixels)
- `icon-192x192.png` (192x192 pixels) - **Required minimum**
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels) - **Required minimum**
- `apple-startup.png` (for iOS startup screen, recommended: 2048x2732)

## How to Generate Icons

You can generate these icons using:

1. **PWABuilder** - https://pwabuilder.com
   - Upload your logo/image
   - Download the generated icon set

2. **RealFaviconGenerator** - https://realfavicongenerator.net
   - Upload your logo
   - Configure settings
   - Download the generated icons

3. **Manual Creation**
   - Create a square image (at least 512x512)
   - Use an image editor to resize to each required size
   - Save as PNG files with the exact names listed above

## Minimum Required Icons

For the PWA to work properly, you need at least:
- `icon-192x192.png` (for Android)
- `icon-512x512.png` (for Android and Chrome)

The other sizes are recommended for better display across different devices.

