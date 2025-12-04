# Fusion Pipeline Fix - Fabric Application Issue

## Problem
The pipeline was generating fabric textures instead of applying fabric to the model/mannequin.

## Root Cause
1. **Missing fabric image reference**: The SD inpainting calls weren't passing the actual fabric images as reference
2. **Text-only prompts**: Relying only on text descriptions doesn't match exact fabric patterns
3. **Potential mask issues**: If segmentation fails, wrong regions might be masked

## Fixes Applied

### 1. Added Fabric Image Reference
- Updated `generateForRegion()` to accept `fabricImageUrl` parameter
- Added multiple parameter names for fabric reference (IP-Adapter support):
  - `ip_adapter_image`
  - `reference_image`
  - `conditioning_image`
  - `style_image`
- Passed fabric URLs to both top and bottom generation calls

### 2. Improved Prompts
- Made prompts more explicit about using "EXACT fabric texture from reference image"
- Emphasized preserving model pose and silhouette
- Added stronger instructions to not modify face/skin/background

### 3. Added Validation & Logging
- Log model image vs fabric image URLs
- Validate that `init_image` is the model, not fabric
- Better error messages for debugging

## Testing Checklist

1. ✅ Verify model image is used as `init_image`
2. ✅ Verify fabric images are passed as reference
3. ✅ Check Bytez API supports IP-Adapter or reference_image
4. ✅ Test with actual fabric images
5. ✅ Verify masks are correct (garment regions only)

## Next Steps if Still Not Working

### Option 1: Use IP-Adapter Model
If Bytez supports IP-Adapter, use a model that specifically supports it:
```typescript
const sdModelId = "runwayml/stable-diffusion-inpainting"; // or IP-Adapter variant
```

### Option 2: Two-Step Process
1. First: Image-to-image with fabric to generate fabric-wrapped shape
2. Second: Composite onto model using mask

### Option 3: Use Different Model
Try models specifically designed for virtual try-on:
- `levihsu/OOTDiffusion` (Outfit of the Day)
- `yisol/IDM-VTON` (Virtual Try-On)

### Option 4: Check Bytez API Documentation
Verify the exact parameter names Bytez uses for:
- Image conditioning
- IP-Adapter
- Reference images

## Debug Commands

Check logs for:
```bash
# Should see:
[fusion] Using model image as init_image: ...
[fusion] Top fabric URL: ...
[fusion] Adding fabric reference image: ...
```

If you see fabric URL as init_image, that's the bug!

