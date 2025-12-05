import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Check,
  Edit,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export default function MaskDetection() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [masksDetected, setMasksDetected] = useState(false);
  const [zoom, setZoom] = useState(100);

  const modelImage = localStorage.getItem("styleweave-model-image");

  const handleDetectMasks = () => {
    setIsProcessing(true);
    setProgress(0);

    // Simulate mask detection
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setMasksDetected(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleConfirm = () => {
    navigate("/fabric-apply");
  };

  const handleEditMask = () => {
    // Navigate to mask editing interface
    console.log("Edit mask");
  };

  if (!modelImage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-royal-plum mb-4">No model image found</p>
          <Button onClick={() => navigate("/upload/model")}>
            Upload Model Photo
          </Button>
        </Card>
      </div>
    );
  }

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
            Magic Cutting Room
          </h1>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Model Preview with Masks */}
          <Card className="p-8 mb-6">
            <div className="relative bg-midnight-indigo/5 rounded-2xl overflow-hidden">
              <div
                className="relative mx-auto"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "center",
                }}
              >
                <img
                  src={modelImage}
                  alt="Model"
                  className="w-full h-auto max-h-[600px] object-contain"
                />

                {/* Topwear Mask Overlay */}
                {masksDetected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    <div
                      className="absolute top-[20%] left-[25%] w-[50%] h-[30%] rounded-2xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(200, 183, 227, 0.4) 0%, rgba(200, 183, 227, 0.6) 100%)",
                        border: "2px solid rgba(200, 183, 227, 0.8)",
                      }}
                    />
                  </motion.div>
                )}

                {/* Bottomwear Mask Overlay */}
                {masksDetected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    <div
                      className="absolute top-[50%] left-[20%] w-[60%] h-[40%] rounded-2xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(233, 215, 166, 0.4) 0%, rgba(233, 215, 166, 0.6) 100%)",
                        border: "2px solid rgba(233, 215, 166, 0.8)",
                      }}
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-royal-plum">
                  <Sparkles className="w-5 h-5 animate-sparkle" />
                  <span className="font-medium">Detecting Outfits...</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Mask Labels */}
            {masksDetected && !isProcessing && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-opal-lavender/10">
                  <div className="w-4 h-4 rounded bg-opal-lavender" />
                  <span className="text-sm font-medium text-royal-plum">
                    Topwear Mask
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gold-soft/20">
                  <div className="w-4 h-4 rounded bg-gold-soft" />
                  <span className="text-sm font-medium text-royal-plum">
                    Bottomwear Mask
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDetectMasks}
                disabled={isProcessing || masksDetected}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Auto-Refine
              </Button>
              <Button
                variant="outline"
                onClick={handleEditMask}
                disabled={!masksDetected}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Mask
              </Button>
              <Button variant="outline" onClick={() => setMasksDetected(false)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
            </div>

            <Button
              variant="default"
              onClick={handleConfirm}
              disabled={!masksDetected}
              size="lg"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm Masks
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

