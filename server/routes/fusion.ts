// Express route endpoints for new fusion pipeline
// POST /api/fusion/upload — accept multipart/form-data
// GET /api/fusion/status/:jobId
// GET /api/fusion/result/:jobId

import express, { type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { storage } from "../storage.js";
import { processReplaceOutfitJob } from "../fusionPipelineNew.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 3, // modelImage, topFabric, bottomFabric
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/i;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error(`Only image files (PNG, JPG, JPEG, WEBP) are allowed. Got: ${file.mimetype}`));
  },
});

// Helper: Upload file buffer to Cloudinary
async function uploadFileToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: "fusion/uploads",
        resource_type: "image",
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Upload failed: no result"));
        }
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * POST /api/fusion/upload
 * Accept multipart/form-data: modelImage, topFabric, bottomFabric, category, userConsent
 * Upload to Cloudinary → create job → call processReplaceOutfitJob asynchronously
 */
router.post(
  "/upload",
  upload.fields([
    { name: "modelImage", maxCount: 1 },
    { name: "topFabric", maxCount: 1 },
    { name: "bottomFabric", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { category, userConsent } = req.body;

      // Validate required files
      if (!files.modelImage || files.modelImage.length === 0) {
        return res.status(400).json({ error: "modelImage is required" });
      }

      if (!files.topFabric && !files.bottomFabric) {
        return res.status(400).json({ error: "At least one fabric image (topFabric or bottomFabric) is required" });
      }

      // Validate category
      const validCategories = ["lehenga", "blouse", "gown", "saree", "salwar", "dress", "top", "skirt", "other"];
      if (!category || !validCategories.includes(category)) {
        return res.status(400).json({ error: "Valid category is required" });
      }

      // Upload files to Cloudinary
      const timestamp = Date.now();
      const uploadPromises: Promise<string>[] = [];

      const modelImageFile = files.modelImage[0];
      uploadPromises.push(
        uploadFileToCloudinary(modelImageFile.buffer, `fusion/${timestamp}/model`)
      );

      let topFabricUrl: string | undefined;
      let bottomFabricUrl: string | undefined;

      if (files.topFabric && files.topFabric.length > 0) {
        uploadPromises.push(
          uploadFileToCloudinary(files.topFabric[0].buffer, `fusion/${timestamp}/top`).then(
            (url) => {
              topFabricUrl = url;
              return url;
            }
          )
        );
      }

      if (files.bottomFabric && files.bottomFabric.length > 0) {
        uploadPromises.push(
          uploadFileToCloudinary(files.bottomFabric[0].buffer, `fusion/${timestamp}/bottom`).then(
            (url) => {
              bottomFabricUrl = url;
              return url;
            }
          )
        );
      }

      const [modelImageUrl, ...fabricUrls] = await Promise.all(uploadPromises);

      // Create fusion job
      const jobId = crypto.randomUUID();
      const newJob = await storage.createFusionJob({
        jobId,
        category: category as any,
        fabricTop: topFabricUrl,
        fabricBottom: bottomFabricUrl,
        referenceModel: modelImageUrl, // Use modelImage as referenceModel
        mode: "hybrid", // Default mode
        strength: 0.5, // Default strength
        userConsent: userConsent === "true" || userConsent === true,
        status: "pending",
        progress: 0,
      });

      // Start processing asynchronously (non-blocking)
      processReplaceOutfitJob(jobId).catch((error) => {
        console.error(`[fusion] Background processing error for job ${jobId}:`, error);
        storage.updateFusionJob(jobId, {
          status: "failed",
          error: error.message || "Processing failed",
        });
      });

      res.json({
        success: true,
        jobId,
        message: "Job created and processing started",
      });
    } catch (error: any) {
      console.error("Fusion upload error:", error);
      res.status(500).json({
        error: error.message || "Upload failed",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

/**
 * GET /api/fusion/status/:jobId
 * Get job status and progress
 */
router.get("/status/:jobId", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await storage.getFusionJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      error: job.error,
      metadata: job.metadata,
    });
  } catch (error: any) {
    console.error("Get status error:", error);
    res.status(500).json({
      error: error.message || "Failed to get status",
    });
  }
});

/**
 * GET /api/fusion/result/:jobId
 * Get final result and candidates
 */
router.get("/result/:jobId", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await storage.getFusionJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "completed") {
      return res.status(202).json({
        message: "Job still processing",
        status: job.status,
        progress: job.progress,
      });
    }

    res.json({
      jobId: job.jobId,
      status: job.status,
      resultUrl: job.resultUrl,
      candidates: job.candidates,
      explainability: job.explainability,
      metadata: job.metadata,
    });
  } catch (error: any) {
    console.error("Get result error:", error);
    res.status(500).json({
      error: error.message || "Failed to get result",
    });
  }
});

export default router;

