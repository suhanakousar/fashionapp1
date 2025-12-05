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

export default function UploadModel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setFile(file);
        createImageUrl(file).then(setPreview);
        toast({
          title: "Image uploaded",
          description: "Model photo uploaded successfully",
        });
      }
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    maxFiles: 1,
  });

  const handleContinue = () => {
    if (preview) {
      // Store in localStorage for now
      localStorage.setItem("styleweave-model-image", preview);
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
                >
                  Remove
                </Button>
                <Button
                  variant="default"
                  onClick={handleContinue}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

