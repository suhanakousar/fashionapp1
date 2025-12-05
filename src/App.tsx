import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import UploadModel from "./pages/UploadModel";
import UploadFabric from "./pages/UploadFabric";
import MaskDetection from "./pages/MaskDetection";
import FabricApply from "./pages/FabricApply";
import FabricLibrary from "./pages/FabricLibrary";
import FinalOutput from "./pages/FinalOutput";
import Settings from "./pages/Settings";
import { Toaster } from "./components/ui/toaster";

function App() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem("styleweave-onboarding-seen");
    setHasSeenOnboarding(seen === "true");
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-royal-plum via-midnight-indigo to-opal-lavender">
        <div className="text-4xl font-semibold text-gold-soft animate-pulse">
          StyleWeave AI
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            hasSeenOnboarding ? (
              <Navigate to="/home" replace />
            ) : (
              <Onboarding onComplete={() => setHasSeenOnboarding(true)} />
            )
          }
        />
        <Route path="/home" element={<Home />} />
        <Route path="/upload/model" element={<UploadModel />} />
        <Route path="/upload/fabric/top" element={<UploadFabric type="top" />} />
        <Route
          path="/upload/fabric/bottom"
          element={<UploadFabric type="bottom" />}
        />
        <Route path="/mask-detection" element={<MaskDetection />} />
        <Route path="/fabric-apply" element={<FabricApply />} />
        <Route path="/fabric-library" element={<FabricLibrary />} />
        <Route path="/final-output" element={<FinalOutput />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;

