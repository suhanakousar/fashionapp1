// Path: server/fusionPipelineNew.ts
// Prototype fusion pipeline for "replace outfit" feature
// - Uses Bytez SDK for model calls
// - Uploads intermediate/final images to Cloudinary
// - Updates fusionJobs collection in MongoDB
// - Includes fallback mock pipeline when model calls fail
// NOTES:
//  - REVIEW REQUIRED: face-protection logic & privacy consent handling below.
//  - This file assumes helper modules exist: bytezClient, cloudinary, db, faceProtect, segmentation, edge, fabricFeatures, postprocess, mockFusion
//  - Matches the notebook approach: SAM segmentation + SD inpainting

import crypto from "crypto";
import sdk from "./bytezClient.js";
import { uploadBufferToCloudinary, uploadBase64ToCloudinary } from "./cloudinary.js";
import { getDb } from "./db.js";
import { detectFacesAndMask } from "./faceProtect.js";
import { runSAM } from "./segmentation.js";
import { makeEdgeMap } from "./edge.js";
import { extractPaletteAndPatches } from "./fabricFeatures.js";
import { blendSeamsAndHarmonize, upscaleImage } from "./postprocess.js";
import { mockFusion } from "./mockFusion.js";
import { storage } from "./storage.js";

const JOBS_COLLECTION = process.env.FUSION_JOBS_COLLECTION || "fusion_jobs";

// Utility: simple backoff
function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

// MAIN exported function: process a job by jobId (UUID string)
export async function processReplaceOutfitJob(jobIdStr: string) {
  const jobDoc = await storage.getFusionJob(jobIdStr);
  if (!jobDoc) {
    throw new Error(`Job ${jobIdStr} not found`);
  }

  // update status helper
  async function updateStatus(status: string, progress?: number, extra?: any) {
    await storage.updateFusionJob(jobIdStr, {
      status: status as any,
      progress: progress ?? jobDoc.progress ?? 0,
      ...(extra || {}),
    });
  }

  try {
    await updateStatus("processing", 3);
    console.log(`[fusion] Starting job ${jobIdStr}`);

    // Get model image (use referenceModel or fabricTop as fallback)
    const modelImageUrl = jobDoc.referenceModel || jobDoc.fabricTop || jobDoc.imageA;
    if (!modelImageUrl) {
      throw new Error("No model image provided");
    }

    // 1) Face detection (protect identity) -------------------------
    // REVIEW REQUIRED: Face protection logic must be verified for legal/privacy compliance.
    await updateStatus("processing", 5, { status: "face-detection" });
    const faceResult = await detectFacesAndMask(modelImageUrl);
    // detectFacesAndMask returns: { faces: [...], faceMaskBase64?: string, faceDetected: boolean }
    if (faceResult.faceDetected) {
      // upload face mask to storage and mark job
      if (faceResult.faceMaskBase64) {
        const faceMaskUpload = await uploadBase64ToCloudinary(
          faceResult.faceMaskBase64,
          `fusion/${jobIdStr}/masks/face-mask`
        );
        await storage.updateFusionJob(jobIdStr, {
          faceProtected: true,
          metadata: {
            ...jobDoc.metadata,
            faceMaskUrl: faceMaskUpload.secure_url,
            faceProtected: true,
          },
        });
        console.log(`[fusion] Face detected — mask stored at ${faceMaskUpload.secure_url}`);
      } else {
        await storage.updateFusionJob(jobIdStr, {
          metadata: {
            ...jobDoc.metadata,
            faceProtected: true,
          },
        });
      }
    } else {
      await storage.updateFusionJob(jobIdStr, {
        metadata: {
          ...jobDoc.metadata,
          faceProtected: false,
        },
      });
      console.log("[fusion] No faces detected or face detection skipped");
    }

    // 2) Segmentation (SAM) on the model image to find garment regions -
    await updateStatus("processing", 12, { status: "segmentation" });
    // runSAM should return masks possibly as base64 PNGs or polygon data. We expect top and bottom masks.
    const samModelMasks = await runSAM(modelImageUrl);
    // samModelMasks expected shape: { topMaskBase64?: string, bottomMaskBase64?: string, mannequinMaskBase64?: string, masksRaw?: any }
    // Upload masks to Cloudinary and store URLs
    const maskUrls: any = {};
    if (samModelMasks.topMaskBase64) {
      const up = await uploadBase64ToCloudinary(samModelMasks.topMaskBase64, `fusion/${jobIdStr}/masks/top`);
      maskUrls.topMaskUrl = up.secure_url;
    }
    if (samModelMasks.bottomMaskBase64) {
      const up = await uploadBase64ToCloudinary(samModelMasks.bottomMaskBase64, `fusion/${jobIdStr}/masks/bottom`);
      maskUrls.bottomMaskUrl = up.secure_url;
    }
    if (samModelMasks.mannequinMaskBase64) {
      const up = await uploadBase64ToCloudinary(samModelMasks.mannequinMaskBase64, `fusion/${jobIdStr}/masks/mannequin`);
      maskUrls.mannequinMaskUrl = up.secure_url;
    }
    if (Object.keys(maskUrls).length) {
      await storage.updateFusionJob(jobIdStr, {
        metadata: {
          ...jobDoc.metadata,
          masks: maskUrls,
        },
      });
    }
    await updateStatus("processing", 18, { status: "segmentation_done" });

    // 3) Edge / silhouette map for ControlNet conditioning
    await updateStatus("processing", 22, { status: "edge_map" });
    const edgeMapBase64 = await makeEdgeMap(modelImageUrl);
    const edgeUpload = await uploadBase64ToCloudinary(edgeMapBase64, `fusion/${jobIdStr}/edge/edge`);
    await storage.updateFusionJob(jobIdStr, {
      metadata: {
        ...jobDoc.metadata,
        edgeMapUrl: edgeUpload.secure_url,
      },
    });
    await updateStatus("processing", 25, { status: "edge_done" });

    // 4) Extract fabric features (palette + patches) from user-provided fabrics
    await updateStatus("processing", 28, { status: "fabric_features" });
    const paletteTop = jobDoc.fabricTop || jobDoc.imageA
      ? await extractPaletteAndPatches(jobDoc.fabricTop || jobDoc.imageA || "", "top")
      : null;
    const paletteBottom = jobDoc.fabricBottom || jobDoc.imageB
      ? await extractPaletteAndPatches(jobDoc.fabricBottom || jobDoc.imageB || "", "bottom")
      : null;
    await storage.updateFusionJob(jobIdStr, {
      metadata: {
        ...jobDoc.metadata,
        paletteTop: paletteTop?.colors,
        paletteBottom: paletteBottom?.colors,
        dominantPattern: paletteTop?.texture || paletteBottom?.texture,
      },
    });
    await updateStatus("processing", 34, { status: "fabric_features_done" });

    // 5) Build prompts for three modes -----------------------------
    await updateStatus("processing", 36, { status: "building_prompts" });
    const negativePrompt = "no faces, no logos, no text, no watermarks, no surreal distortions, avoid unnatural stretching";

    const topDesc = paletteTop
      ? `${paletteTop.colors.slice(0, 3).join(", ")}; texture: ${paletteTop.texture || "fabric"}`
      : "fabric top sample";
    const bottomDesc = paletteBottom
      ? `${paletteBottom.colors.slice(0, 3).join(", ")}; texture: ${paletteBottom.texture || "fabric"}`
      : "fabric bottom sample";

    // Get fabric URLs for prompt enhancement
    const topFabricUrlForPrompt = jobDoc.fabricTop || jobDoc.imageA;
    const bottomFabricUrlForPrompt = jobDoc.fabricBottom || jobDoc.imageB;
    
    const silhouettePrompt = `Photorealistic inpainting. Preserve the model's exact pose, silhouette, and body shape. Apply the EXACT fabric texture and pattern from the reference fabric image to the top region (blouse/shirt). Use the fabric colors: ${topDesc}. Keep the same garment silhouette, seams, and folds. Do NOT change the model's pose, face, skin, hands, or background. The fabric should drape naturally on the existing garment shape.`;
    const texturePrompt = `Photorealistic inpainting. Apply the EXACT fabric pattern and texture from the reference fabric image to the garment region. Match the fabric's colors, motifs, and texture details precisely. Preserve the model's pose, silhouette, and body shape. Keep face and skin unmodified. Ensure the fabric pattern scales naturally and follows the garment's folds and seams.`;
    const hybridPrompt = `Balanced fusion: Apply the exact fabric texture from the reference image to the garment while preserving the model's pose and silhouette. Match fabric colors (${topDesc}) and patterns precisely. Keep natural garment drape, seams, and folds. Do not modify face, skin, or background.`;

    await storage.updateFusionJob(jobIdStr, {
      metadata: {
        ...jobDoc.metadata,
        prompts: { silhouettePrompt, texturePrompt, hybridPrompt, negativePrompt },
      },
    });
    await updateStatus("processing", 40, { status: "prompts_built" });

    // 6) Generator: call Bytez SD image-to-image / inpainting endpoints
    await updateStatus("processing", 45, { status: "generating_candidates" });

    // Helper that wraps a Bytez model.run with retries
    async function runModelWithRetries(modelId: string, payload: any, attempts = 3) {
      const model = sdk.model(modelId);
      let attempt = 0;
      while (attempt < attempts) {
        attempt++;
        try {
          const { error, output } = await model.run(payload);
          if (error) {
            console.warn(`[fusion] model ${modelId} attempt ${attempt} error:`, error);
            await sleep(400 * attempt);
            continue;
          }
          return { output };
        } catch (err) {
          console.error(`[fusion] exception calling ${modelId} attempt ${attempt}`, err);
          await sleep(500 * attempt);
        }
      }
      throw new Error(`Model ${modelId} failed after ${attempts} attempts`);
    }

    // We'll attempt to generate candidates sequentially to manage quota. You could parallelize if resources allow.
    const sdModelId = "stabilityai/stable-diffusion-xl-base-1.0"; // example; change to available model on Bytez
    const controlnetModelId = "lllyasviel/control_v11p_sd15_canny"; // if Bytez exposes a merged endpoint you can pass controlnet payloads in one call

    // Build common payload bits
    // CRITICAL: initImage must be the MODEL/MANNEQUIN image, NOT the fabric
    const initImage = modelImageUrl; // Model/mannequin image - this is what we're modifying
    const topMaskBase64 = samModelMasks.topMaskBase64; // may be undefined
    const bottomMaskBase64 = samModelMasks.bottomMaskBase64;
    const edgeMapUrl = edgeUpload.secure_url;
    
    // Validate that initImage is actually the model, not fabric
    console.log(`[fusion] Using model image as init_image: ${initImage.substring(0, 80)}...`);
    console.log(`[fusion] Top fabric URL: ${jobDoc.fabricTop || jobDoc.imageA || 'none'}`);
    console.log(`[fusion] Bottom fabric URL: ${jobDoc.fabricBottom || jobDoc.imageB || 'none'}`);

    const candidates: Array<{ url: string; meta?: any }> = [];

    // Utility to prepare payload for region-based inpainting
    async function generateForRegion(
      regionMaskBase64: string | undefined,
      promptText: string,
      modeTag: string,
      strength = 0.55,
      fabricImageUrl?: string // Add fabric image as reference
    ) {
      // Mask should be base64 PNG where white=area to change (inpainting models vary; check provider)
      // CRITICAL: init_image = model/mannequin, fabric_image = reference for pattern
      const payload: any = {
        init_image: initImage, // Model/mannequin image - the base image we're modifying
        mask: regionMaskBase64, // base64 or url - white areas will be replaced
        prompt: promptText,
        negative_prompt: negativePrompt,
        parameters: {
          strength,
          guidance_scale: 8.0,
          num_inference_steps: 28,
          controlnet: {
            image: edgeMapUrl,
            weight: 1.0,
          },
        },
      };
      
      console.log(`[fusion] Generating ${modeTag} with init_image (model) and fabric reference`);
      
      // Add fabric image as reference if available (for IP-Adapter or image conditioning)
      // Bytez may support IP-Adapter or reference_image parameter
      if (fabricImageUrl) {
        // Try multiple parameter names that different providers might use
        // IP-Adapter (most common for image conditioning)
        payload.ip_adapter_image = fabricImageUrl;
        payload.ip_adapter_scale = 0.8; // Control how strongly to follow the reference
        
        // Alternative parameter names
        payload.reference_image = fabricImageUrl;
        payload.conditioning_image = fabricImageUrl;
        payload.style_image = fabricImageUrl;
        
        // Some models accept it in parameters
        if (!payload.parameters) payload.parameters = {};
        payload.parameters.reference_image = fabricImageUrl;
        payload.parameters.ip_adapter_image = fabricImageUrl;
        
        // Log for debugging
        console.log(`[fusion] Adding fabric reference image: ${fabricImageUrl.substring(0, 50)}...`);
      }
      
      // Bytez/your provider might accept controlnet as top-level or inside parameters, adapt as needed.
      const res = await runModelWithRetries(sdModelId, payload, 3);
      // `res.output` might be a base64 or an array; map accordingly
      return res.output;
    }

    // Strategy: two approaches:
    // A) Region-by-region: generate top region replacement, then bottom region replacement using result of prior step as init_image.
    // B) One-shot: single prompt specifying both regions and a combined mask (if provider supports multi-region masks).
    // We'll implement region-by-region for simplicity.

    let intermediateImageUrl = initImage; // start with original
    let intermediateBuffer: Buffer | null = null;

    // 6a) Generate top region (silhouette-first variant -> use silhouettePrompt as example for top)
    try {
      await updateStatus("processing", 50, { status: "generating_top" });
      if (!topMaskBase64) {
        console.warn("[fusion] no top mask available, attempting generation using whole upper-body region heuristics");
      }
      // Get fabric image URL for top region
      const topFabricUrl = jobDoc.fabricTop || jobDoc.imageA;
      
      const topOutput = await generateForRegion(
        topMaskBase64,
        silhouettePrompt,
        "top-silhouette",
        jobDoc.strength ?? 0.45,
        topFabricUrl // Pass fabric image as reference
      );
      // topOutput handling: if base64 -> upload to cloudinary
      let topUrl: string | null = null;
      if (topOutput) {
        // If output returned is base64 string or an array, handle accordingly
        if (typeof topOutput === "string" && topOutput.startsWith("data:image")) {
          const up = await uploadBase64ToCloudinary(topOutput, `fusion/${jobIdStr}/candidates/top-${Date.now()}`);
          topUrl = up.secure_url;
        } else if (Array.isArray(topOutput) && typeof topOutput[0] === "string") {
          const up = await uploadBase64ToCloudinary(topOutput[0], `fusion/${jobIdStr}/candidates/top-${Date.now()}`);
          topUrl = up.secure_url;
        } else if (topOutput && typeof topOutput === "object" && (topOutput as any).url) {
          topUrl = (topOutput as any).url;
        }
      }
      if (topUrl) {
        // set intermediate image to topUrl for next step (bottom generation)
        intermediateImageUrl = topUrl;
        await updateStatus("processing", 60, { status: "top_done" });
      } else {
        throw new Error("Top generation returned no usable output");
      }
    } catch (err) {
      console.error("[fusion] top generation error:", err);
      // Attempt fallback: mock blend top fabric into model image
      const fallbackBuf = await mockFusion(
        modelImageUrl,
        jobDoc.fabricTop || jobDoc.fabricBottom || jobDoc.imageA || modelImageUrl,
        0.45
      );
      const upload = await uploadBufferToCloudinary(fallbackBuf, `fusion/${jobIdStr}/fallback/top-${Date.now()}.png`);
      intermediateImageUrl = upload.secure_url;
      await storage.updateFusionJob(jobIdStr, {
        candidates: [{ url: upload.secure_url, mode: "silhouette-first" as any, meta: { fallback: true, region: "top", error: String(err) } }],
      });
      await updateStatus("processing", 60, { status: "top_fallback" });
    }

    // 6b) Generate bottom region (texture-first / hybrid)
    try {
      await updateStatus("processing", 64, { status: "generating_bottom" });
      const bottomPromptToUse = texturePrompt;
      // Get fabric image URL for bottom region
      const bottomFabricUrl = jobDoc.fabricBottom || jobDoc.imageB;
      
      const bottomOutput = await generateForRegion(
        bottomMaskBase64,
        bottomPromptToUse,
        "bottom-texture",
        jobDoc.strength ?? 0.6,
        bottomFabricUrl // Pass fabric image as reference
      );
      let bottomUrl: string | null = null;
      if (typeof bottomOutput === "string" && bottomOutput.startsWith("data:image")) {
        const up = await uploadBase64ToCloudinary(bottomOutput, `fusion/${jobIdStr}/candidates/bottom-${Date.now()}`);
        bottomUrl = up.secure_url;
      } else if (Array.isArray(bottomOutput) && typeof bottomOutput[0] === "string") {
        const up = await uploadBase64ToCloudinary(bottomOutput[0], `fusion/${jobIdStr}/candidates/bottom-${Date.now()}`);
        bottomUrl = up.secure_url;
      } else if (bottomOutput && typeof bottomOutput === "object" && (bottomOutput as any).url) {
        bottomUrl = (bottomOutput as any).url;
      }

      // Typically, you'd composite top and bottom outputs or run a final hybrid pass to reconcile seams.
      if (bottomUrl) {
        // Composite/merge top (intermediateImageUrl) and bottom (bottomUrl) to produce final candidate
        // We'll fetch both as buffers, composite via sharp with mask blending
        const topBufResp = await fetch(intermediateImageUrl);
        const topBuf = Buffer.from(await topBufResp.arrayBuffer());
        const bottomBufResp = await fetch(bottomUrl);
        const bottomBuf = Buffer.from(await bottomBufResp.arrayBuffer());

        // blendSeamsAndHarmonize will take base image (topBuf) and overlay bottomBuf using bottom mask/paste and seam blur
        const compositeBuf = await blendSeamsAndHarmonize(topBuf, bottomBuf, samModelMasks.bottomMaskBase64);
        const finalUpload = await uploadBufferToCloudinary(compositeBuf, `fusion/${jobIdStr}/candidates/final-${Date.now()}`);
        candidates.push({ url: finalUpload.secure_url, meta: { mode: "top-then-bottom-hybrid" } });
        await updateStatus("processing", 82, { status: "bottom_done" });
      } else {
        throw new Error("Bottom generation returned no usable output");
      }
    } catch (err) {
      console.error("[fusion] bottom generation error:", err);
      // fallback bottom mock
      const fallbackBuf2 = await mockFusion(
        intermediateImageUrl,
        jobDoc.fabricBottom || jobDoc.fabricTop || jobDoc.imageB || modelImageUrl,
        0.5
      );
      const upload = await uploadBufferToCloudinary(fallbackBuf2, `fusion/${jobIdStr}/fallback/bottom-${Date.now()}.png`);
      candidates.push({ url: upload.secure_url, meta: { fallback: true, region: "bottom", error: String(err) } });
      await updateStatus("processing", 82, { status: "bottom_fallback" });
    }

    // 7) Optional: final hybrid pass (run a full-image hybrid prompt to smooth seams)
    try {
      await updateStatus("processing", 86, { status: "final_pass" });
      const hybridPayload: any = {
        init_image: candidates.length ? candidates[0].url : intermediateImageUrl,
        mask: undefined, // if provider supports negative masking for entire garment region, include combined mask
        prompt: hybridPrompt,
        negative_prompt: negativePrompt,
        parameters: {
          strength: 0.45,
          guidance_scale: 7.5,
          num_inference_steps: 20,
          controlnet: { image: edgeUpload.secure_url, weight: 0.8 },
        },
      };
      const hybridRes = await runModelWithRetries(sdModelId, hybridPayload, 2);
      if (hybridRes?.output) {
        let hybridUrl: string | null = null;
        if (typeof hybridRes.output === "string" && hybridRes.output.startsWith("data:image")) {
          const up = await uploadBase64ToCloudinary(hybridRes.output, `fusion/${jobIdStr}/candidates/hybrid-${Date.now()}`);
          hybridUrl = up.secure_url;
        } else if (Array.isArray(hybridRes.output) && typeof hybridRes.output[0] === "string") {
          const up = await uploadBase64ToCloudinary(hybridRes.output[0], `fusion/${jobIdStr}/candidates/hybrid-${Date.now()}`);
          hybridUrl = up.secure_url;
        } else if (hybridRes.output && typeof hybridRes.output === "object" && (hybridRes.output as any).url) {
          hybridUrl = (hybridRes.output as any).url;
        }
        if (hybridUrl) {
          candidates.push({ url: hybridUrl, meta: { mode: "final-hybrid" } });
          await updateStatus("processing", 94, { status: "hybrid_done" });
        }
      }
    } catch (err) {
      console.warn("[fusion] final hybrid pass failed, continuing with existing candidates", err);
    }

    // 8) Upscale / postprocess each candidate (Real-ESRGAN)
    await updateStatus("processing", 95, { status: "upscaling" });
    const finalCandidates: Array<{ url: string; mode?: string; meta?: any }> = [];
    for (const c of candidates) {
      try {
        // call Real-ESRGAN via Bytez or local upscaler - simplified:
        const upscalerModel = sdk.model("xinntao/Real-ESRGAN"); // adjust to actual model id on Bytez
        const { error, output } = await upscalerModel.run({ image: c.url, scale: 2 });
        if (!error && output) {
          // upload result if base64
          let upscaledUrl: string | null = null;
          if (typeof output === "string" && output.startsWith("data:image")) {
            const up = await uploadBase64ToCloudinary(output, `fusion/${jobIdStr}/candidates/upscaled-${Date.now()}`);
            upscaledUrl = up.secure_url;
          } else if (output && typeof output === "object" && (output as any).url) {
            upscaledUrl = (output as any).url;
          }
          if (upscaledUrl) {
            finalCandidates.push({ url: upscaledUrl, mode: c.mode || "hybrid", meta: { ...c.meta, upscaled: true } });
          } else {
            // If output not useable, fallback to original candidate
            finalCandidates.push(c);
          }
        } else {
          // Fallback: use local upscaling
          try {
            const response = await fetch(c.url);
            const buffer = Buffer.from(await response.arrayBuffer());
            const upscaled = await upscaleImage(buffer, 2);
            const upload = await uploadBufferToCloudinary(upscaled, `fusion/${jobIdStr}/candidates/upscaled-${Date.now()}.png`);
            finalCandidates.push({ url: upload.secure_url, mode: c.mode || "hybrid", meta: { ...c.meta, upscaled: true } });
          } catch (localErr) {
            console.warn("[fusion] local upscaling failed, using original", localErr);
            finalCandidates.push(c);
          }
        }
      } catch (err) {
        console.warn("[fusion] upscaler error for candidate", c.url, err);
        finalCandidates.push(c);
      }
    }

    // 9) Save final candidates to job doc and mark done
    await storage.updateFusionJob(jobIdStr, {
      candidates: finalCandidates.map((c) => ({ url: c.url, mode: (c.mode || "hybrid") as any, meta: c.meta })),
      status: "completed",
      progress: 100,
      resultUrl: finalCandidates[0]?.url,
    });
    console.log(`[fusion] Job ${jobIdStr} done. Candidates:`, finalCandidates.map((f) => f.url));
    return finalCandidates;
  } catch (err: any) {
    console.error("[fusion] pipeline error", err);
    // Attempt graceful fallback: produce mock result and mark job done with fallback
    try {
      const fallbackBuf = await mockFusion(
        modelImageUrl,
        jobDoc.fabricTop || jobDoc.fabricBottom || jobDoc.imageA || modelImageUrl,
        0.5
      );
      const upload = await uploadBufferToCloudinary(fallbackBuf, `fusion/${jobIdStr}/fallback/final-${Date.now()}.png`);
      await storage.updateFusionJob(jobIdStr, {
        candidates: [{ url: upload.secure_url, mode: "hybrid" as any, meta: { fallback: true } }],
        status: "completed",
        resultUrl: upload.secure_url,
        error: String(err),
        progress: 100,
      });
      return [{ url: upload.secure_url, meta: { fallback: true } }];
    } catch (fallbackErr) {
      console.error("[fusion] fallback also failed", fallbackErr);
      await storage.updateFusionJob(jobIdStr, {
        status: "failed",
        error: String(err),
        progress: 0,
      });
      throw err;
    }
  }
}

// Export for other modules
export default processReplaceOutfitJob;

