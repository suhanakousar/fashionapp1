# Fusion Pipeline Fix - Using Wrong Pipeline

## Problem Identified

You were using the **old upload interface** (`/fusion` page) which was calling the **old pipeline** (`processFusionJob` from `fusionPipeline.ts`) instead of the **new pipeline** (`processReplaceOutfitJob` from `fusionPipelineNew.ts`).

The old pipeline doesn't have the fixes for:
- Passing fabric images as reference
- Better prompts for exact fabric matching
- Proper model image validation

## Fix Applied

### 1. Updated `server/fusion.ts`
Changed the pipeline import to use the new pipeline:
```typescript
// OLD (wrong):
import("./fusionPipeline.js").then(({ processFusionJob }) => {
  processFusionJob(jobId)...
});

// NEW (correct):
import("./fusionPipelineNew.js").then(({ processReplaceOutfitJob }) => {
  processReplaceOutfitJob(jobId)...
});
```

### 2. Improved Model Image Selection
- Removed `fabricTop` as fallback for model image (that was wrong!)
- Now correctly uses: `referenceModel || imageA` for model/mannequin
- Added validation to ensure model image exists
- Added validation to ensure at least one fabric exists

### 3. Better Logging
Added console logs to track:
- Which image is used as model/mannequin
- Which images are used as fabrics
- When fabric references are added to payload

## What This Fixes

✅ **Correct Pipeline**: Now uses the new pipeline with fabric image reference support  
✅ **Correct Model Image**: Uses `referenceModel` (your mannequin) as base, not fabric  
✅ **Fabric Reference**: Passes fabric images to the model for exact pattern matching  
✅ **Better Validation**: Ensures you have both model and fabric images  

## Testing

1. **Upload your images again** using the same interface:
   - Reference Model Dress: Your mannequin image
   - Top Fabric: Pink fabric
   - Bottom Fabric: Beige fabric

2. **Check the console logs** - you should see:
   ```
   [fusion] Model image (mannequin): https://...
   [fusion] Top fabric: https://...
   [fusion] Bottom fabric: https://...
   [fusion] Adding fabric reference image: https://...
   ```

3. **Expected Result**: The mannequin should now wear the fabrics, not just show fabric textures

## If Still Not Working

If you still see just fabric textures:

1. **Check Bytez API Support**: The Bytez API might not support IP-Adapter or reference images. Check their documentation for:
   - Image conditioning parameters
   - IP-Adapter support
   - Reference image parameters

2. **Check Console Logs**: Look for errors about unsupported parameters

3. **Try Different Model**: You might need to use a model that specifically supports image conditioning:
   ```typescript
   const sdModelId = "runwayml/stable-diffusion-inpainting"; // or IP-Adapter variant
   ```

4. **Verify Masks**: The segmentation might be failing. Check if masks are being generated correctly.

## Next Steps

1. ✅ **Restart your server** to load the updated code
2. ✅ **Try uploading again** with the same images
3. ✅ **Check the logs** to see what's happening
4. ✅ **Report back** if it's still showing just fabric textures

The fix is now in place - the old interface will use the new, improved pipeline!

