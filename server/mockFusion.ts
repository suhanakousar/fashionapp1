// Mock fusion fallback: CSS-style composite when model calls fail
// Creates a simple visual composite to demonstrate functionality

import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

/**
 * Generate mock fusion result by compositing fabric onto model image
 * This is a fallback when ML models are unavailable or fail
 */
export async function mockFusion(
  modelImageUrl: string,
  fabricImageUrl: string,
  strength: number = 0.5
): Promise<Buffer> {
  try {
    // Fetch both images
    const [modelResponse, fabricResponse] = await Promise.all([
      fetch(modelImageUrl),
      fetch(fabricImageUrl),
    ]);
    
    const modelBuffer = Buffer.from(await modelResponse.arrayBuffer());
    const fabricBuffer = Buffer.from(await fabricResponse.arrayBuffer());
    
    // Get model image dimensions
    const modelImage = sharp(modelBuffer);
    const modelMetadata = await modelImage.metadata();
    const width = modelMetadata.width || 512;
    const height = modelMetadata.height || 768;
    
    // Resize fabric to match model dimensions
    const resizedFabric = await sharp(fabricBuffer)
      .resize(width, height, {
        fit: "cover",
      })
      .toBuffer();
    
    // Create a simple overlay composite
    // Apply fabric as overlay with opacity based on strength
    const composite = await modelImage
      .composite([
        {
          input: resizedFabric,
          blend: "multiply", // Multiply blend mode for fabric overlay
          opacity: Math.round(strength * 100), // 0-100 based on strength
        },
      ])
      .modulate({
        brightness: 1.0 + (strength * 0.1), // Slight brightness adjustment
        saturation: 1.0 + (strength * 0.2), // Enhance saturation
      })
      .png()
      .toBuffer();
    
    return composite;
  } catch (error: any) {
    console.error("Mock fusion error:", error);
    
    // Last resort: return model image as-is
    try {
      const response = await fetch(modelImageUrl);
      return Buffer.from(await response.arrayBuffer());
    } catch (fetchError) {
      throw new Error("Mock fusion failed and cannot fetch model image");
    }
  }
}

/**
 * Create a simple color overlay (even simpler fallback)
 */
export async function createColorOverlay(
  modelImageUrl: string,
  dominantColor: string,
  region: "top" | "bottom"
): Promise<Buffer> {
  try {
    const response = await fetch(modelImageUrl);
    const modelBuffer = Buffer.from(await response.arrayBuffer());
    
    const modelImage = sharp(modelBuffer);
    const metadata = await modelImage.metadata();
    const width = metadata.width || 512;
    const height = metadata.height || 768;
    
    // Create a colored rectangle for the region
    const regionHeight = region === "top" ? height * 0.4 : height * 0.6;
    const regionY = region === "top" ? 0 : height * 0.4;
    
    // Create colored overlay
    const overlay = await sharp({
      create: {
        width,
        height: regionHeight,
        channels: 4,
        background: { r: 255, g: 107, b: 107, alpha: 0.6 }, // Default pink, would use dominantColor
      },
    })
      .png()
      .toBuffer();
    
    // Composite overlay onto model
    const result = await modelImage
      .composite([
        {
          input: overlay,
          top: Math.floor(regionY),
          left: 0,
          blend: "over",
        },
      ])
      .png()
      .toBuffer();
    
    return result;
  } catch (error) {
    console.error("Color overlay error:", error);
    const response = await fetch(modelImageUrl);
    return Buffer.from(await response.arrayBuffer());
  }
}

