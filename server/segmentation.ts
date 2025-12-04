// SAM (Segment Anything Model) wrapper for garment segmentation
// Uses Bytez SDK to call facebook/sam-vit-base

import sdk from "./bytezClient.js";
import { uploadBase64ToCloudinary } from "./cloudinary.js";

export interface SAMResult {
  topMaskBase64?: string;
  bottomMaskBase64?: string;
  mannequinMaskBase64?: string;
  masksRaw?: any;
}

/**
 * Run SAM segmentation on model image to extract garment regions
 * Returns masks for top, bottom, and full mannequin regions
 */
export async function runSAM(imageUrl: string): Promise<SAMResult> {
  try {
    // Use Bytez SAM model
    const samModel = sdk.model("facebook/sam-vit-base");
    
    // For garment segmentation, we need to provide point prompts
    // Top region: point around chest/shoulder area (approximate: 50% width, 30% height)
    // Bottom region: point around waist/hip area (approximate: 50% width, 60% height)
    
    // First, get image dimensions (we'll use default 1024x1536 for portrait)
    // In production, you'd fetch and analyze the image first
    
    const topPoint = [512, 460]; // Approximate center of top region
    const bottomPoint = [512, 920]; // Approximate center of bottom region
    
    // Run SAM for top region
    const topResult = await samModel.run({
      image: imageUrl,
      prompts: [
        {
          type: "point",
          coordinates: topPoint,
        },
      ],
    });
    
    // Run SAM for bottom region
    const bottomResult = await samModel.run({
      image: imageUrl,
      prompts: [
        {
          type: "point",
          coordinates: bottomPoint,
        },
      ],
    });
    
    // Parse results
    // Bytez SAM typically returns masks as base64 PNG strings or arrays
    const topMasks = (topResult.output as any)?.masks || [];
    const bottomMasks = (bottomResult.output as any)?.masks || [];
    
    // Select best mask (highest score or first one)
    const topMaskBase64 = topMasks.length > 0 
      ? (typeof topMasks[0] === "string" ? topMasks[0] : topMasks[0].mask || topMasks[0])
      : undefined;
    
    const bottomMaskBase64 = bottomMasks.length > 0
      ? (typeof bottomMasks[0] === "string" ? bottomMasks[0] : bottomMasks[0].mask || bottomMasks[0])
      : undefined;
    
    // For full mannequin mask, combine top and bottom or use a full-body point
    const fullBodyPoint = [512, 768]; // Center of image
    const fullResult = await samModel.run({
      image: imageUrl,
      prompts: [
        {
          type: "point",
          coordinates: fullBodyPoint,
        },
      ],
    });
    
    const fullMasks = (fullResult.output as any)?.masks || [];
    const mannequinMaskBase64 = fullMasks.length > 0
      ? (typeof fullMasks[0] === "string" ? fullMasks[0] : fullMasks[0].mask || fullMasks[0])
      : undefined;
    
    return {
      topMaskBase64,
      bottomMaskBase64,
      mannequinMaskBase64,
      masksRaw: {
        top: topMasks,
        bottom: bottomMasks,
        full: fullMasks,
      },
    };
  } catch (error: any) {
    console.error("SAM segmentation error:", error);
    
    // Fallback: return empty masks (will trigger mock fusion)
    return {
      topMaskBase64: undefined,
      bottomMaskBase64: undefined,
      mannequinMaskBase64: undefined,
    };
  }
}

/**
 * Helper: Convert mask array to base64 PNG
 * (If SAM returns raw mask data, convert it to base64)
 */
export async function maskArrayToBase64(maskArray: number[][]): Promise<string> {
  // This is a placeholder - actual implementation would use sharp or canvas
  // to convert 2D array to PNG base64
  throw new Error("maskArrayToBase64 not implemented - use mask URLs directly");
}

