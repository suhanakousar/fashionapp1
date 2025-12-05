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
    console.log("App mounted");
    try {
      const seen = typeof window !== "undefined" 
        ? localStorage.getItem("styleweave-onboarding-seen")
        : null;
      setHasSeenOnboarding(seen === "true");
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      setHasSeenOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh",
        background: "linear-gradient(135deg, #4C1A4F 0%, #0A0E37 50%, #C8B7E3 100%)"
      }}>
        <div style={{ 
          fontSize: "2rem", 
          fontWeight: 600, 
          color: "#E9D7A6",
          animation: "pulse 2s infinite"
        }}>
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

