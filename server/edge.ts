// Edge detection for ControlNet conditioning
// Uses Canny or HED edge detection via Bytez

import sdk from "./bytezClient.js";
import { uploadBase64ToCloudinary } from "./cloudinary.js";

/**
 * Create edge map for ControlNet conditioning
 * Returns base64 PNG of edge map
 */
export async function makeEdgeMap(
  imageUrl: string,
  edgeType: "canny" | "hed" = "canny"
): Promise<string> {
  try {
    // Use Bytez for edge detection
    // ControlNet Canny model can extract edges directly
    const edgeModelId = edgeType === "canny"
      ? "lllyasviel/control_v11p_sd15_canny"
      : "lllyasviel/control_v11p_sd15_hed";
    
    const edgeModel = sdk.model(edgeModelId);
    
    const result = await edgeModel.run({
      image: imageUrl,
      mode: "edge_detection",
    });
    
    // Result should be base64 edge map
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Handle different output formats
    let edgeMapBase64: string | undefined;
    
    if (typeof result.output === "string") {
      edgeMapBase64 = result.output;
    } else if (Array.isArray(result.output) && result.output.length > 0) {
      edgeMapBase64 = typeof result.output[0] === "string" ? result.output[0] : result.output[0].url;
    } else if (result.output && typeof result.output === "object") {
      edgeMapBase64 = (result.output as any).edge_map || (result.output as any).url || (result.output as any).image;
    }
    
    if (!edgeMapBase64) {
      throw new Error("Edge detection returned no valid output");
    }
    
    // Ensure it's base64 (add data URL prefix if missing)
    if (!edgeMapBase64.startsWith("data:image")) {
      edgeMapBase64 = `data:image/png;base64,${edgeMapBase64}`;
    }
    
    return edgeMapBase64;
  } catch (error: any) {
    console.error("Edge detection error:", error);
    
    // Fallback: use Cloudinary edge detection
    try {
      const { v2: cloudinary } = await import("cloudinary");
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        const edgeUrl = cloudinary.url(publicId, {
          transformation: [
            { effect: "edge_detect:50" },
            { effect: "grayscale" },
          ],
        });
        
        // Fetch and convert to base64
        const response = await fetch(edgeUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        return `data:image/png;base64,${buffer.toString("base64")}`;
      }
    } catch (fallbackError) {
      console.error("Fallback edge detection also failed:", fallbackError);
    }
    
    // Last resort: return original image (will degrade quality but won't fail)
    return imageUrl;
  }
}

/**
 * Extract Cloudinary public ID from URL
 */
function extractPublicId(url: string): string | null {
  try {
    if (url.includes("cloudinary.com")) {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\?|$)/);
      if (match && match[1]) {
        return match[1].replace(/\.(jpg|jpeg|png|webp)$/i, "");
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

