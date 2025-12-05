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
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    console.log("App mounted");
    
    // Timeout fallback - if loading takes more than 5 seconds, show error
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.error("Loading timeout - app may have failed to initialize");
        setLoadError("Loading is taking longer than expected. Please check the browser console for errors.");
        setIsLoading(false);
      }
    }, 5000);

    try {
      const seen = typeof window !== "undefined" 
        ? localStorage.getItem("styleweave-onboarding-seen")
        : null;
      setHasSeenOnboarding(seen === "true");
      setIsLoading(false);
      clearTimeout(timeoutId);
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      setHasSeenOnboarding(false);
      setIsLoading(false);
      clearTimeout(timeoutId);
    }
    
    return () => clearTimeout(timeoutId);
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh",
        background: "linear-gradient(135deg, #4C1A4F 0%, #0A0E37 50%, #C8B7E3 100%)"
      }}>
        <div style={{ 
          fontSize: "2rem", 
          fontWeight: 600, 
          color: "#E9D7A6",
          marginBottom: "1rem"
        }}>
          Loading StyleWeave AI...
        </div>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid #C8B7E3",
          borderTopColor: "#E9D7A6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh",
        padding: "20px",
        background: "linear-gradient(135deg, #4C1A4F 0%, #0A0E37 50%, #C8B7E3 100%)",
        color: "#E9D7A6"
      }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Loading Error</h1>
        <p style={{ marginBottom: "1rem", opacity: 0.9 }}>{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "12px 24px",
            background: "#E9D7A6",
            color: "#0A0E37",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Reload Page
        </button>
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

