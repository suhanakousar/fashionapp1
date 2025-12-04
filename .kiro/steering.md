# Kiro Steering Document: Fusion Pipeline

## Overview

This document guides the AI assistant in maintaining and extending the fusion pipeline for virtual try-on functionality.

## Architecture

### Pipeline Flow

1. **Face Detection** → Detect faces, create masks, require consent
2. **Segmentation (SAM)** → Extract top/bottom garment regions
3. **Edge Extraction** → Generate ControlNet edge maps
4. **Fabric Analysis** → Extract color palettes and texture patches
5. **Prompt Construction** → Build region-specific prompts
6. **Image Generation** → Run SD inpainting per region
7. **Post-Processing** → Blend seams, harmonize colors, upscale

### Key Design Decisions

- **Region-by-region generation**: Generate top first, then bottom, then composite
- **Fallback chain**: Bytez → HuggingFace → Replicate → Mock
- **Face protection**: Always detect, require consent, never modify faces
- **Async processing**: Jobs run in background, status polled by frontend

## Code Locations

### Backend

- `server/fusionPipelineNew.ts` - Main pipeline orchestrator
- `server/routes/fusion.ts` - Express API endpoints
- `server/bytezClient.ts` - Bytez SDK wrapper
- `server/segmentation.ts` - SAM wrapper
- `server/edge.ts` - Edge detection
- `server/fabricFeatures.ts` - Color/texture extraction
- `server/postprocess.ts` - Seam blending, upscaling
- `server/mockFusion.ts` - Fallback composite
- `server/faceProtect.ts` - Face detection and masking

### Frontend

- `client/src/pages/FusionNew.tsx` - Main fusion page
- `client/src/components/FabricUploader.tsx` - File upload UI
- `client/src/components/FusionProgress.tsx` - Status polling UI
- `client/src/components/FusionResults.tsx` - Results display
- `client/src/components/TryOnCanvas.tsx` - Canvas overlay

## Review Required Sections

All sections marked with `// REVIEW REQUIRED` must be reviewed for:
- Legal compliance (face protection, privacy)
- Security (API keys, data retention)
- Performance (rate limiting, caching)

Locations:
- `server/faceProtect.ts` - Face masking policy
- `server/fusionPipelineNew.ts` - Face detection step
- `server/routes/fusion.ts` - Consent handling

## Extension Points

### Adding New Models

1. Add model wrapper in `server/models/`
2. Update fallback chain in `fusionPipelineNew.ts`
3. Add to `.kiro/spec.yaml`

### Adding New Features

1. Update pipeline in `fusionPipelineNew.ts`
2. Add UI in `FusionNew.tsx`
3. Update API in `routes/fusion.ts`
4. Document in this file

## Testing

- Unit tests: `tests/fusion.test.ts` (to be created)
- Integration: Use sample notebook `changing.ipynb` as reference
- Demo script: `demo/3-minute-script.md`

## Deployment

- Environment variables: See `.env.example`
- Database: MongoDB collection `fusion_jobs`
- Storage: Cloudinary folder `fusion/`
- API routes: `/api/fusion/*`
