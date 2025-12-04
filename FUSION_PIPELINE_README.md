# Fusion Pipeline - Virtual Try-On Feature

Production-ready virtual try-on pipeline that takes a model image and fabric images, then generates a photorealistic image of the model wearing the fabrics.

## Overview

This implementation follows the approach from `changing.ipynb`:
- **SAM (Segment Anything Model)** for garment segmentation
- **Stable Diffusion inpainting** for fabric application
- **ControlNet** for pose/silhouette preservation
- **Face protection** for privacy compliance

## Architecture

```
User Upload → Face Detection → SAM Segmentation → Edge Extraction
    ↓
Fabric Analysis → Prompt Construction → SD Inpainting (per region)
    ↓
Seam Blending → Color Harmonization → Upscaling → Final Result
```

## Environment Variables

Create a `.env` file with:

```bash
# Required
BYTEZ_API_KEY=your_bytez_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
DATABASE_URL=mongodb://your_connection_string
SESSION_SECRET=your_session_secret

# Optional (fallbacks)
HUGGINGFACE_API_KEY=your_hf_key
REPLICATE_API_TOKEN=your_replicate_token

# Face protection
AUTO_MASK_FACES=false  # Set to true to auto-mask without consent
```

## Installation

```bash
# Install dependencies
npm install

# Add missing packages if needed
npm install node-vibrant sharp

# Set up environment
cp .env.example .env
# Edit .env with your credentials
```

## Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### POST /api/fusion/upload

Upload model and fabric images, create fusion job.

**Request:**
- `multipart/form-data`
- Fields:
  - `modelImage` (required): Model/person image
  - `topFabric` (optional): Top fabric image
  - `bottomFabric` (optional): Bottom fabric image
  - `category`: Garment category (dress, top, skirt, etc.)
  - `userConsent`: Boolean string for face masking consent

**Response:**
```json
{
  "success": true,
  "jobId": "uuid-string",
  "message": "Job created and processing started"
}
```

### GET /api/fusion/status/:jobId

Get job status and progress.

**Response:**
```json
{
  "jobId": "uuid-string",
  "status": "processing",
  "progress": 45,
  "error": null,
  "metadata": { ... }
}
```

### GET /api/fusion/result/:jobId

Get final result and candidates.

**Response:**
```json
{
  "jobId": "uuid-string",
  "status": "completed",
  "resultUrl": "https://cloudinary.com/...",
  "candidates": [
    {
      "url": "https://cloudinary.com/...",
      "mode": "hybrid",
      "meta": { ... }
    }
  ],
  "explainability": { ... },
  "metadata": { ... }
}
```

## Demo Script (3-minute walkthrough)

### Step 1: Upload Images (30s)
1. Navigate to `/fusion-new` (or integrate into existing Fusion page)
2. Upload model image (person/mannequin photo)
3. Upload top fabric image
4. Upload bottom fabric image (optional)
5. Select category
6. Check consent checkbox if faces detected

### Step 2: Generate (2min)
1. Click "Continue" to start processing
2. Watch progress bar:
   - Face detection (5%)
   - Segmentation (18%)
   - Edge extraction (25%)
   - Fabric analysis (34%)
   - Prompt building (40%)
   - Top generation (60%)
   - Bottom generation (82%)
   - Final hybrid pass (94%)
   - Upscaling (100%)

### Step 3: Results (30s)
1. View generated candidates
2. Toggle face protection overlay
3. Download final image
4. View explainability panel

## File Structure

```
server/
├── bytezClient.ts          # Bytez SDK wrapper
├── cloudinary.ts           # Cloudinary upload helpers
├── faceProtect.ts          # Face detection & masking
├── segmentation.ts         # SAM wrapper
├── edge.ts                 # Edge detection for ControlNet
├── fabricFeatures.ts       # Color palette & patch extraction
├── postprocess.ts          # Seam blending & upscaling
├── mockFusion.ts           # Fallback composite
├── fusionPipelineNew.ts    # Main pipeline orchestrator
└── routes/
    └── fusion.ts           # Express API endpoints

client/src/
├── pages/
│   └── FusionNew.tsx      # Main fusion page
└── components/
    ├── FabricUploader.tsx
    ├── FusionProgress.tsx
    ├── FusionResults.tsx
    └── TryOnCanvas.tsx

.kiro/
├── spec.yaml              # Kiro specification
├── steering.md            # Design constraints
└── prompts/
    └── fusion_prompt_templates.md
```

## Models Used

- **facebook/sam-vit-base** (Bytez) - Garment segmentation
- **stabilityai/stable-diffusion-xl-base-1.0** (Bytez) - Image inpainting
- **lllyasviel/control_v11p_sd15_canny** (Bytez) - Edge detection
- **xinntao/Real-ESRGAN** (Bytez) - Image upscaling
- **damo/retinaface** (Bytez) - Face detection

## Safety & Privacy

### Face Protection
- Faces are automatically detected
- User consent required for processing
- Face regions are masked and never modified
- Marked with `// REVIEW REQUIRED` for legal review

### Data Retention
- Images auto-delete after 30 days (configurable)
- TTL can be set per job
- API endpoint for manual deletion

### Copyright
- Do not train on copyrighted images
- Use open datasets or synthetic renders for training
- Respect image licensing

## Testing

```bash
# Run tests (when created)
npm test

# Test with sample notebook
# Use changing.ipynb as reference for expected behavior
```

## Troubleshooting

### Bytez API Errors
- Check `BYTEZ_API_KEY` is set
- Verify API quota/limits
- Check model availability on Bytez

### Cloudinary Upload Failures
- Verify Cloudinary credentials
- Check file size limits (10MB)
- Ensure valid image formats (PNG, JPG, WEBP)

### Segmentation Issues
- SAM may fail on low-quality images
- Fallback to mock fusion if segmentation fails
- Check image dimensions (min 512x512 recommended)

### Face Detection Not Working
- Try HuggingFace API as fallback
- Check `AUTO_MASK_FACES` setting
- Verify user consent is provided

## Next Steps (Training Roadmap)

For higher quality results:

1. **Collect Training Data**
   - Paired images (model + various fabrics)
   - Or synthesize via texture mapping

2. **Train LoRA**
   - Use `train_network.py` with small rank (4-16)
   - Few epochs on curated dataset
   - Monitor FID/perceptual loss

3. **CLIP Conditioning**
   - Use CLIP embeddings of fabrics as conditioning tokens
   - Improves fabric-to-garment mapping

## Support

- Check `.kiro/steering.md` for architecture details
- See `.kiro/prompts/fusion_prompt_templates.md` for prompt examples
- Review `changing.ipynb` for notebook reference

## License

See main project LICENSE file.

