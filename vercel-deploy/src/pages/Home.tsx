import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
const { Upload, Shirt, Sparkles, Bell, User, Image: ImageIcon, ArrowRight } = LucideIcons;
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [hasModel, setHasModel] = useState(false);
  const [hasTopFabric, setHasTopFabric] = useState(false);
  const [hasBottomFabric, setHasBottomFabric] = useState(false);

  const canGenerate = hasModel && hasTopFabric && hasBottomFabric;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl-white via-pearl-cream to-opal-lavender-light">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-opal-lavender/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-plum to-midnight-indigo flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-gold-soft" />
            </div>
            <span className="text-2xl font-semibold text-royal-plum">
              StyleWeave AI
            </span>
          </motion.div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-6"
        >
          <h1 className="text-5xl md:text-6xl font-semibold text-royal-plum">
            Transform Fabrics Into
            <br />
            <span className="text-gradient">Fashion Magic</span>
          </h1>
          <p className="text-xl text-midnight-indigo/70 max-w-2xl mx-auto">
            Upload your model photo and fabrics. Watch AI create stunning outfit
            previews in seconds.
          </p>
        </motion.div>

        {/* Quick Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Upload Model Photo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              className={`cursor-pointer hover:shadow-glow transition-all ${
                hasModel ? "ring-2 ring-gold-soft" : ""
              }`}
              onClick={() => navigate("/upload/model")}
            >
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-royal-plum to-opal-lavender flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-pearl-white" />
                </div>
                <h3 className="text-xl font-semibold text-royal-plum">
                  Upload Model Photo
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start by adding your model image
                </p>
                {hasModel && (
                  <div className="text-xs text-gold-dark font-medium">
                    ✓ Uploaded
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upload Top Fabric */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              className={`cursor-pointer hover:shadow-glow transition-all ${
                hasTopFabric ? "ring-2 ring-gold-soft" : ""
              }`}
              onClick={() => navigate("/upload/fabric/top")}
            >
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-opal-lavender to-royal-plum flex items-center justify-center">
                  <Shirt className="w-10 h-10 text-pearl-white" />
                </div>
                <h3 className="text-xl font-semibold text-royal-plum">
                  Top Fabric
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload fabric for topwear
                </p>
                {hasTopFabric && (
                  <div className="text-xs text-gold-dark font-medium">
                    ✓ Uploaded
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upload Bottom Fabric */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              className={`cursor-pointer hover:shadow-glow transition-all ${
                hasBottomFabric ? "ring-2 ring-gold-soft" : ""
              }`}
              onClick={() => navigate("/upload/fabric/bottom")}
            >
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-gold-soft to-opal-lavender flex items-center justify-center">
                  <Shirt className="w-10 h-10 text-midnight-indigo" />
                </div>
                <h3 className="text-xl font-semibold text-royal-plum">
                  Bottom Fabric
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload fabric for bottomwear
                </p>
                {hasBottomFabric && (
                  <div className="text-xs text-gold-dark font-medium">
                    ✓ Uploaded
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Start Styling Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-12"
        >
          <Button
            size="lg"
            variant={canGenerate ? "gold" : "outline"}
            disabled={!canGenerate}
            onClick={() => navigate("/mask-detection")}
            className="text-lg px-8 py-6 group"
          >
            Generate Outfit Preview
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          {!canGenerate && (
            <p className="text-sm text-muted-foreground mt-4">
              Please upload model photo and both fabrics to continue
            </p>
          )}
        </motion.div>

        {/* Recent Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-royal-plum mb-6">
            Recent Projects
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card
                key={i}
                className="aspect-square cursor-pointer hover:shadow-glow transition-all overflow-hidden"
              >
                <div className="w-full h-full bg-gradient-to-br from-opal-lavender/20 to-royal-plum/20 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-opal-lavender/50" />
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

