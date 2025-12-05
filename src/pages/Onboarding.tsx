import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, Wand2, ArrowRight } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    title: "AI Fashion Redefined",
    subtitle: "Turn your fabric into realistic outfits instantly.",
    description: "Upload. Apply. Visualize.",
    icon: Sparkles,
    gradient: "from-royal-plum via-midnight-indigo to-opal-lavender",
  },
  {
    id: 2,
    title: "Upload Your Fabrics",
    subtitle: "Use any fabric image — cotton, silk, embroidery, print.",
    description: "The app will automatically prepare it.",
    icon: Upload,
    gradient: "from-opal-lavender via-royal-plum to-gold-soft",
  },
  {
    id: 3,
    title: "Try On the Model",
    subtitle: "AI fits the fabric onto your model flawlessly.",
    description: "See your designs come to life.",
    icon: Wand2,
    gradient: "from-gold-soft via-opal-lavender to-royal-plum",
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      localStorage.setItem("styleweave-onboarding-seen", "true");
      onComplete();
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-royal-plum via-midnight-indigo to-opal-lavender flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gold-soft/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-8"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex justify-center"
            >
              <div className={`p-8 rounded-3xl bg-gradient-to-br ${slide.gradient} shadow-glow-lg`}>
                <Icon className="w-24 h-24 text-pearl-white" />
              </div>
            </motion.div>

            {/* Content */}
            <div className="space-y-4">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-semibold text-gold-soft"
              >
                {slide.title}
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl text-pearl-white/90"
              >
                {slide.subtitle}
              </motion.p>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-pearl-white/70"
              >
                {slide.description}
              </motion.p>
            </div>

            {/* Illustration placeholder */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="h-64 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 flex items-center justify-center"
            >
              <div className="text-pearl-white/50 text-sm">
                {currentSlide === 0 && "Model silhouette + fabric swatches"}
                {currentSlide === 1 && "Fabric textures being scanned"}
                {currentSlide === 2 && "Model with fabric applied"}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-8 bg-gold-soft"
                    : "w-2 bg-pearl-white/30"
                }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <Button
            onClick={nextSlide}
            variant="gold"
            size="lg"
            className="group"
          >
            {currentSlide === slides.length - 1 ? (
              "Get Started"
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

