import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
const { ArrowLeft, Upload, X, Check } = LucideIcons;
import { createImageUrl } from "../lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { api } from "../lib/api";

export default function UploadModel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setFile(file);
        // Show preview immediately
        createImageUrl(file).then(setPreview);
        
        // Upload to backend
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'model');
          
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const response = await fetch(`${API_URL}/v1/upload`, {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Upload failed');
          }
          
          const result = await response.json();
          setUploadId(result.upload._id);
          
          // Store both preview and upload data
          localStorage.setItem("styleweave-model-image", preview || '');
          localStorage.setItem("styleweave-model-upload-id", result.upload._id);
          localStorage.setItem("styleweave-model-url", result.upload.cloudinary.secure_url);
          
          toast({
            title: "Image uploaded",
            description: "Model photo uploaded and stored successfully",
          });
        } catch (error) {
          console.error("Upload error:", error);
          toast({
            title: "Upload failed",
            description: "Failed to upload to server. File saved locally only.",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }
    },
    [toast, preview]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    maxFiles: 1,
  });

  const handleContinue = () => {
    if (preview && uploadId) {
      navigate("/home");
    } else if (preview) {
      // If upload failed, still allow continue with local preview
      toast({
        title: "Warning",
        description: "File not uploaded to server. Some features may not work.",
        variant: "destructive",
      });
      navigate("/home");
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl-white via-pearl-cream to-opal-lavender-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-semibold text-royal-plum">
            Upload Model Photo
          </h1>
        </div>

        <div className="max-w-4xl mx-auto">
          {!preview ? (
            <Card className="p-12">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? "border-royal-plum bg-opal-lavender/10"
                    : "border-opal-lavender hover:border-royal-plum hover:bg-opal-lavender/5"
                }`}
              >
                <input {...getInputProps()} />
                <motion.div
                  animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                  className="space-y-4"
                >
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-royal-plum to-opal-lavender flex items-center justify-center">
                    <Upload className="w-10 h-10 text-pearl-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-royal-plum mb-2">
                      Upload a clear front-view photo of your model
                    </h3>
                    <p className="text-muted-foreground">
                      Drag and drop your image here, or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Supported: JPG, PNG
                    </p>
                  </div>
                </motion.div>
              </div>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <Card className="overflow-hidden">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Model preview"
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 bg-white/90 hover:bg-white"
                    onClick={handleRemove}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </Card>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleRemove}
                  className="flex-1"
                  disabled={isUploading}
                >
                  Remove
                </Button>
                <Button
                  variant="default"
                  onClick={handleContinue}
                  className="flex-1"
                  disabled={isUploading || !uploadId}
                >
                  {isUploading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Continue
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

