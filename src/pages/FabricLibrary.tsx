import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
const { ArrowLeft, Plus, Shirt } = LucideIcons;

const fabricCategories = [
  {
    id: "silk",
    name: "Silk",
    preview: "linear-gradient(135deg, #E9D7A6 0%, #C8B7E3 100%)",
  },
  {
    id: "cotton",
    name: "Cotton",
    preview: "linear-gradient(135deg, #F5F3F0 0%, #E9D7A6 100%)",
  },
  {
    id: "floral",
    name: "Floral Prints",
    preview: "linear-gradient(135deg, #C8B7E3 0%, #4C1A4F 100%)",
  },
  {
    id: "kurtis",
    name: "Kurtis Prints",
    preview: "linear-gradient(135deg, #4C1A4F 0%, #0A0E37 100%)",
  },
  {
    id: "saree",
    name: "Saree Patterns",
    preview: "linear-gradient(135deg, #E9D7A6 0%, #4C1A4F 100%)",
  },
  {
    id: "embroidery",
    name: "Embroidery",
    preview: "linear-gradient(135deg, #0A0E37 0%, #C8B7E3 100%)",
  },
];

export default function FabricLibrary() {
  const navigate = useNavigate();
  const [selectedFabric, setSelectedFabric] = useState<string | null>(null);

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
            Fabric Library
          </h1>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Add Custom Fabric */}
          <Card className="mb-8 p-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/upload/fabric/top")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Fabric
            </Button>
          </Card>

          {/* Fabric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fabricCategories.map((fabric, index) => (
              <motion.div
                key={fabric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`cursor-pointer hover:shadow-glow transition-all ${
                    selectedFabric === fabric.id
                      ? "ring-2 ring-gold-soft"
                      : ""
                  }`}
                  onClick={() => setSelectedFabric(fabric.id)}
                >
                  <CardContent className="p-0">
                    <div
                      className="aspect-square rounded-t-xl"
                      style={{ background: fabric.preview }}
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-royal-plum text-center">
                        {fabric.name}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Selected Fabric Actions */}
          {selectedFabric && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Card className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-royal-plum mb-2">
                      {fabricCategories.find((f) => f.id === selectedFabric)
                        ?.name || "Selected Fabric"}
                    </h3>
                    <p className="text-muted-foreground">
                      Apply this fabric to your outfit
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/upload/fabric/top")}
                    >
                      <Shirt className="w-4 h-4 mr-2" />
                      Apply to Top
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/upload/fabric/bottom")}
                    >
                      <Shirt className="w-4 h-4 mr-2" />
                      Apply to Bottom
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

