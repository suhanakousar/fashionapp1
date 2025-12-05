import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Download,
  Save,
  Share2,
  RefreshCw,
  Compare,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function FabricApply() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(true);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [beforeAfterPosition, setBeforeAfterPosition] = useState(50);

  const [topScale, setTopScale] = useState([100]);
  const [topOrientation, setTopOrientation] = useState([0]);
  const [topStrength, setTopStrength] = useState([80]);

  const [bottomScale, setBottomScale] = useState([100]);
  const [bottomOrientation, setBottomOrientation] = useState([0]);
  const [bottomStrength, setBottomStrength] = useState([80]);

  const modelImage = localStorage.getItem("styleweave-model-image");
  const topFabricData = localStorage.getItem("styleweave-fabric-top");
  const bottomFabricData = localStorage.getItem("styleweave-fabric-bottom");

  useEffect(() => {
    // Simulate AI processing
    const timer = setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Outfit generated!",
        description: "Your fabric has been applied successfully",
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Your HD render is being prepared",
    });
  };

  const handleSave = () => {
    toast({
      title: "Project saved",
      description: "Your design has been saved to your library",
    });
  };

  const handleShare = () => {
    toast({
      title: "Share options",
      description: "Choose a platform to share your design",
    });
  };

  if (!modelImage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-royal-plum mb-4">Missing required images</p>
          <Button onClick={() => navigate("/home")}>Go to Home</Button>
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
            onClick={() => navigate("/mask-detection")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-semibold text-royal-plum">
            Preview Outfit
          </h1>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Main Preview Area */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="relative bg-midnight-indigo/5 rounded-2xl overflow-hidden">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-[600px] space-y-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-16 h-16 text-royal-plum" />
                    </motion.div>
                    <p className="text-royal-plum font-medium">
                      Applying fabrics...
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    {showBeforeAfter ? (
                      <div className="relative h-[600px] overflow-hidden rounded-xl">
                        <img
                          src={modelImage}
                          alt="Before"
                          className="absolute inset-0 w-full h-full object-contain"
                          style={{
                            clipPath: `inset(0 ${100 - beforeAfterPosition}% 0 0)`,
                          }}
                        />
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-opal-lavender/20 to-royal-plum/20 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-2xl font-semibold text-royal-plum mb-2">
                              ✨ AI Applied Fabric
                            </p>
                            <p className="text-muted-foreground">
                              Drag the slider to compare
                            </p>
                          </div>
                        </div>
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-gold-soft cursor-ew-resize z-10"
                          style={{ left: `${beforeAfterPosition}%` }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gold-soft border-2 border-white shadow-lg flex items-center justify-center">
                            <Compare className="w-4 h-4 text-midnight-indigo" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={modelImage}
                          alt="Model with applied fabric"
                          className="w-full h-auto max-h-[600px] object-contain rounded-xl"
                        />
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 shimmer pointer-events-none"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </Card>

            {/* Bottom Toolbar */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <Button
                variant={showBeforeAfter ? "default" : "outline"}
                onClick={() => setShowBeforeAfter(!showBeforeAfter)}
              >
                <Compare className="w-4 h-4 mr-2" />
                Compare Mode
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download HD
              </Button>
              <Button variant="outline" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Project
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Side Panel Controls */}
          <div className="space-y-6">
            {/* Topwear Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Topwear Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topFabricData && (
                  <div className="aspect-square rounded-xl overflow-hidden border border-opal-lavender/20 mb-4">
                    <img
                      src={JSON.parse(topFabricData).image}
                      alt="Top fabric"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-royal-plum font-medium">Scale</span>
                    <span className="text-muted-foreground">{topScale[0]}%</span>
                  </div>
                  <Slider
                    value={topScale}
                    onValueChange={setTopScale}
                    min={50}
                    max={200}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-royal-plum font-medium">
                      Orientation
                    </span>
                    <span className="text-muted-foreground">
                      {topOrientation[0]}°
                    </span>
                  </div>
                  <Slider
                    value={topOrientation}
                    onValueChange={setTopOrientation}
                    min={-180}
                    max={180}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-royal-plum font-medium">Strength</span>
                    <span className="text-muted-foreground">
                      {topStrength[0]}%
                    </span>
                  </div>
                  <Slider
                    value={topStrength}
                    onValueChange={setTopStrength}
                    min={0}
                    max={100}
                  />
                </div>

                <Button variant="outline" className="w-full">
                  Change Fabric
                </Button>
              </CardContent>
            </Card>

            {/* Bottomwear Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bottomwear Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bottomFabricData && (
                  <div className="aspect-square rounded-xl overflow-hidden border border-opal-lavender/20 mb-4">
                    <img
                      src={JSON.parse(bottomFabricData).image}
                      alt="Bottom fabric"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-royal-plum font-medium">Scale</span>
                    <span className="text-muted-foreground">
                      {bottomScale[0]}%
                    </span>
                  </div>
                  <Slider
                    value={bottomScale}
                    onValueChange={setBottomScale}
                    min={50}
                    max={200}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-royal-plum font-medium">
                      Orientation
                    </span>
                    <span className="text-muted-foreground">
                      {bottomOrientation[0]}°
                    </span>
                  </div>
                  <Slider
                    value={bottomOrientation}
                    onValueChange={setBottomOrientation}
                    min={-180}
                    max={180}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-royal-plum font-medium">Strength</span>
                    <span className="text-muted-foreground">
                      {bottomStrength[0]}%
                    </span>
                  </div>
                  <Slider
                    value={bottomStrength}
                    onValueChange={setBottomStrength}
                    min={0}
                    max={100}
                  />
                </div>

                <Button variant="outline" className="w-full">
                  Change Fabric
                </Button>
              </CardContent>
            </Card>

            <Button
              variant="gold"
              className="w-full"
              onClick={() => {
                setIsGenerating(true);
                setTimeout(() => setIsGenerating(false), 2000);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate with Better Quality
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

