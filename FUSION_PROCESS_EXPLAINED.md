# How Fusion Works - Step by Step

## 🎨 The Fusion Process

### Step 1: Upload Two Images
- **Image A**: Base garment (e.g., a plain saree)
- **Image B**: Pattern/design source (e.g., a paisley pattern)

### Step 2: Feature Extraction
The system analyzes both images to extract:
- **Colors/Palette**: Dominant colors from each image
- **Patterns**: Textures, motifs, designs
- **Garment Type**: Saree, lehenga, salwar, etc.

### Step 3: Prompt Construction
Based on the selected mode (Pattern/Color/Texture), the system creates an AI prompt:
- **Pattern Mode**: "Apply paisley pattern from Image B to pallu of Image A"
- **Color Mode**: "Blend color palettes from both images"
- **Texture Mode**: "Overlay texture from Image B onto Image A"

### Step 4: Image Generation
The system uses AI (HuggingFace or Cloudinary in mock mode) to:
1. Take Image A as the base
2. Apply transformations based on Image B
3. Generate 3 candidate variations
4. Select the best result

### Step 5: Post-Processing
- **Upscaling**: Increase resolution for quality
- **Explainability**: Generate notes about what was fused
- **Final Result**: The combined, regenerated image

## 👗 How It Shows on Mannequin

### The MannequinCanvas Component:
1. **Background**: Shows a mannequin silhouette (30% opacity)
2. **Overlay**: The fusion result is overlaid on top
3. **Interactive**: You can:
   - Drag to reposition
   - Zoom in/out (50%-200%)
   - Rotate (90° increments)
   - Toggle spooky overlay effects

### Visual Flow:
```
Image A (Base) + Image B (Pattern) 
    ↓
AI Processing
    ↓
Fusion Result (New Combined Image)
    ↓
Displayed on Mannequin Canvas
```

## 🔧 Technical Details

### Mock Mode (Development):
- Uses Cloudinary image transformations
- Blends both images using overlay effects
- Applies artistic filters to simulate AI generation
- Creates visual difference to show fusion worked

### Production Mode (with HuggingFace):
- Uses Stable Diffusion image-to-image model
- Actually regenerates the image using AI
- Preserves silhouette while applying new patterns/colors
- Higher quality, more realistic results

## 📊 What Gets Combined:

1. **Patterns**: Motifs from Image B applied to Image A
2. **Colors**: Palette blending from both images
3. **Textures**: Fabric textures overlaid
4. **Structure**: Original garment shape preserved

## 🎯 Result:
A **new, unique image** that combines elements from both inputs while maintaining the original garment's structure and silhouette.

