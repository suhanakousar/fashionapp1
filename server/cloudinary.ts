// Cloudinary upload helpers for fusion pipeline

import { v2 as cloudinary } from "cloudinary";

// Initialize Cloudinary if credentials are available
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload buffer to Cloudinary
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  publicId: string,
  options?: {
    folder?: string;
    resource_type?: "image" | "video" | "raw";
    format?: string;
  }
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      public_id: publicId,
      folder: options?.folder,
      resource_type: options?.resource_type || "image",
      format: options?.format,
      overwrite: true,
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("Upload failed: no result"));
        }
      }
    ).end(buffer);
  });
}

/**
 * Upload base64 image to Cloudinary
 */
export async function uploadBase64ToCloudinary(
  base64Data: string,
  publicId: string,
  options?: {
    folder?: string;
    resource_type?: "image" | "video" | "raw";
  }
): Promise<{ secure_url: string; public_id: string }> {
  // Remove data URL prefix if present
  const base64 = base64Data.includes(",") 
    ? base64Data.split(",")[1] 
    : base64Data;

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      public_id: publicId,
      folder: options?.folder,
      resource_type: options?.resource_type || "image",
      overwrite: true,
    };

    cloudinary.uploader.upload(
      `data:image/png;base64,${base64}`,
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("Upload failed: no result"));
        }
      }
    );
  });
}

/**
 * Upload file from URL to Cloudinary
 */
export async function uploadUrlToCloudinary(
  url: string,
  publicId: string,
  options?: {
    folder?: string;
    resource_type?: "image" | "video" | "raw";
  }
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      public_id: publicId,
      folder: options?.folder,
      resource_type: options?.resource_type || "image",
      overwrite: true,
    };

    cloudinary.uploader.upload(
      url,
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("Upload failed: no result"));
        }
      }
    );
  });
}

