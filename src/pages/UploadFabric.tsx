import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Upload, X, Check, RotateCw } from "lucide-react";
import { createImageUrl } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function UploadFabric() {
  const { type } = useParams<{ type: "top" | "bottom" }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState([100]);
  const [rotate, setRotate] = useState([0]);
  const [intensity, setIntensity] = useState([50]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setFile(file);
        createImageUrl(file).then(setPreview);
        toast({
          title: "Fabric uploaded",
          description: `${type === "top" ? "Top" : "Bottom"} fabric uploaded successfully`,
        });
      }
    },
    [toast, type]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    maxFiles: 1,
  });

  const handleSave = () => {
    if (preview) {
      const fabricData = {
        image: preview,
        scale: scale[0],
        rotate: rotate[0],
        intensity: intensity[0],
        type,
      };
      localStorage.setItem(
        `styleweave-fabric-${type}`,
        JSON.stringify(fabricData)
      );
      toast({
        title: "Fabric saved",
        description: "Fabric style saved successfully",
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
            Upload {type === "top" ? "Top" : "Bottom"} Fabric
          </h1>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Fabric Upload</CardTitle>
            </CardHeader>
            <CardContent>
              {!preview ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
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
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-royal-plum to-opal-lavender flex items-center justify-center">
                      <Upload className="w-8 h-8 text-pearl-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-royal-plum mb-2">
                        Upload Fabric Image
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Drag and drop or click to browse
                      </p>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-opal-lavender/20">
                    <img
                      src={preview}
                      alt="Fabric preview"
                      className="w-full h-full object-cover"
                      style={{
                        transform: `scale(${scale[0] / 100}) rotate(${rotate[0]}deg)`,
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRemove}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Fabric
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Fabric Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {preview ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-royal-plum font-medium">Scale</span>
                      <span className="text-muted-foreground">{scale[0]}%</span>
                    </div>
                    <Slider
                      value={scale}
                      onValueChange={setScale}
                      min={50}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-royal-plum font-medium">Rotate</span>
                      <span className="text-muted-foreground">
                        {rotate[0]}°
                      </span>
                    </div>
                    <Slider
                      value={rotate}
                      onValueChange={setRotate}
                      min={-180}
                      max={180}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-royal-plum font-medium">
                        Pattern Intensity
                      </span>
                      <span className="text-muted-foreground">
                        {intensity[0]}%
                      </span>
                    </div>
                    <Slider
                      value={intensity}
                      onValueChange={setIntensity}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>

                  <Button
                    variant="default"
                    onClick={handleSave}
                    className="w-full"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Save Fabric Style
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Upload a fabric to adjust settings
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

