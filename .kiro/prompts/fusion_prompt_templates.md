# Fusion Prompt Templates

Exact prompt templates for garment region inpainting. Copy/paste-ready for Bytez SD inpainting calls.

## Silhouette-First (Apply to Top Region)

```
Photorealistic inpainting: Replace the blouse/top region with the user-provided top fabric texture while preserving the person's exact pose, silhouette, skin tones, face, hair and lighting. Use the uploaded fabric image's pattern and dominant colors: [PALETTE_TOP]. Ensure natural fabric drape, realistic seams at the sleeves and neckline, and consistent shadows. Do not modify face, skin, hands, or background. Output full resolution image with the same framing as input.
```

**Negative prompt:**
```
no faces, no text, no logos, no watermarks, no surreal distortions, avoid unnatural stretching.
```

## Texture-First (Apply to Bottom Region)

```
Photorealistic inpainting: Apply the uploaded bottom fabric pattern (sampled from [TOP_PATCHES_BOTTOM]) to the skirt/pants region of the model image. Prioritize pattern fidelity and texture detail while keeping wearable folds. Preserve silhouette and pose. Keep face and body unmodified. Use realistic fabric reflectance and shadowing when integrating.
```

**Negative prompt:**
```
no faces, no text, no logos, no watermarks, no surreal distortions, avoid unnatural stretching.
```

## Hybrid (Apply Both Regions Together or Sequentially)

```
Balanced fusion: apply fabricTop to blouse region and fabricBottom to bottom region. Preserve pose and identity, ensure coherent seam and waistband matching, fabric scale consistent across regions, natural folds, realistic lighting. Maintain high fidelity to uploaded fabrics.
```

**Negative prompt:**
```
no faces, no text, no logos, no watermarks, no surreal distortions, avoid unnatural stretching.
```

## Placeholder Replacement

The assistant must auto-fill:
- `[PALETTE_TOP]` - Dominant colors from top fabric (e.g., "#ff6b6b, #9b59ff, #ff8fb1")
- `[TOP_PATCHES_BOTTOM]` - Representative patch descriptions or URLs from bottom fabric

These are extracted by `extractPaletteAndPatches()` in `server/fabricFeatures.ts`.

## Usage Example

```typescript
const paletteTop = await extractPaletteAndPatches(fabricTopUrl, "top");
const prompt = silhouettePrompt.replace(
  "[PALETTE_TOP]",
  paletteTop.colors.slice(0, 3).join(", ")
);
```
