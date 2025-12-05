import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Edit, Home, Star, Sparkles } from "lucide-react";
import { useState } from "react";

export default function FinalOutput() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);

  const modelImage = localStorage.getItem("styleweave-model-image");
  const topFabricData = localStorage.getItem("styleweave-fabric-top");
  const bottomFabricData = localStorage.getItem("styleweave-fabric-bottom");

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl-white via-pearl-cream to-opal-lavender-light">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          {/* Success Message */}
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gold-soft to-opal-lavender flex items-center justify-center"
            >
              <Sparkles className="w-10 h-10 text-royal-plum" />
            </motion.div>
            <h1 className="text-4xl font-semibold text-royal-plum">
              Your Design is Ready!
            </h1>
            <p className="text-xl text-muted-foreground">
              Beautifully crafted with AI precision
            </p>
          </div>

          {/* Main Preview */}
          <Card className="p-8 bg-white">
            <div className="relative bg-pearl-white rounded-2xl overflow-hidden">
              {modelImage && (
                <img
                  src={modelImage}
                  alt="Final outfit"
                  className="w-full h-auto max-h-[600px] object-contain mx-auto"
                />
              )}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gold-soft/90 backdrop-blur-sm text-midnight-indigo text-sm font-medium">
                Designed with AI
              </div>
            </div>
          </Card>

          {/* Fabric Swatches */}
          <div className="grid grid-cols-2 gap-4">
            {topFabricData && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">Top Fabric</p>
                  <div
                    className="aspect-square rounded-xl mb-2"
                    style={{
                      background: JSON.parse(topFabricData).image
                        ? `url(${JSON.parse(topFabricData).image})`
                        : "linear-gradient(135deg, #C8B7E3 0%, #4C1A4F 100%)",
                      backgroundSize: "cover",
                    }}
                  />
                </CardContent>
              </Card>
            )}
            {bottomFabricData && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Bottom Fabric
                  </p>
                  <div
                    className="aspect-square rounded-xl mb-2"
                    style={{
                      background: JSON.parse(bottomFabricData).image
                        ? `url(${JSON.parse(bottomFabricData).image})`
                        : "linear-gradient(135deg, #E9D7A6 0%, #4C1A4F 100%)",
                      backgroundSize: "cover",
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Rating */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-royal-plum mb-4">
              How satisfied are you?
            </h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "fill-gold-soft text-gold-soft"
                        : "text-opal-lavender/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="gold"
              size="lg"
              onClick={() => {
                // Handle download
              }}
            >
              <Download className="w-5 h-5 mr-2" />
              Download HD
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/fabric-apply")}
            >
              <Edit className="w-5 h-5 mr-2" />
              Edit Again
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/home")}
            >
              <Home className="w-5 h-5 mr-2" />
              Start New Design
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

