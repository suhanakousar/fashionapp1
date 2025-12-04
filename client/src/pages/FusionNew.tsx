// Main fusion page with stepper: upload, options, generate, results
// Uses new fusion pipeline API endpoints

import { useState, useEffect } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { FabricUploader } from "@/components/FabricUploader";
import { FusionProgress } from "@/components/FusionProgress";
import { FusionResults } from "@/components/FusionResults";
import { TryOnCanvas } from "@/components/TryOnCanvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronRight, ChevronLeft, Sparkles, Shield } from "lucide-react";
import { api } from "@/lib/api";
import type { GarmentCategory } from "../../../shared/schema.js";

type Step = "upload" | "options" | "generate" | "results";

export default function FusionNew() {
  const [step, setStep] = useState<Step>("upload");
  const [category, setCategory] = useState<GarmentCategory>("other");
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [topFabric, setTopFabric] = useState<File | null>(null);
  const [bottomFabric, setBottomFabric] = useState<File | null>(null);
  const [userConsent, setUserConsent] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending");
  const [jobProgress, setJobProgress] = useState(0);
  const [jobError, setJobError] = useState<string>();
  const [jobResult, setJobResult] = useState<any>();

  // Poll job status
  useEffect(() => {
    if (!jobId || jobStatus === "completed" || jobStatus === "failed") return;

    const interval = setInterval(async () => {
      try {
        const data = await api.get(`/api/fusion/status/${jobId}`);
        setJobStatus(data.status);
        setJobProgress(data.progress);
        setJobError(data.error);
        if (data.status === "completed") {
          const resultData = await api.get(`/api/fusion/result/${jobId}`);
          setJobResult(resultData);
          setStep("results");
        } else if (data.status === "failed") {
          setStep("generate");
        }
      } catch (error: any) {
        console.error("Status check error:", error);
        if (error.response?.status === 404) {
          // Job not found, stop polling
          clearInterval(interval);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  const handleFileSelect = (type: "model" | "top" | "bottom", file: File) => {
    if (type === "model") setModelImage(file);
    else if (type === "top") setTopFabric(file);
    else if (type === "bottom") setBottomFabric(file);
  };

  const handleRemoveFile = (type: "model" | "top" | "bottom") => {
    if (type === "model") setModelImage(null);
    else if (type === "top") setTopFabric(null);
    else if (type === "bottom") setBottomFabric(null);
  };

  const handleSubmit = async () => {
    if (!modelImage || (!topFabric && !bottomFabric)) {
      alert("Please upload a model image and at least one fabric image");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("modelImage", modelImage);
      if (topFabric) formData.append("topFabric", topFabric);
      if (bottomFabric) formData.append("bottomFabric", bottomFabric);
      formData.append("category", category);
      formData.append("userConsent", userConsent.toString());

      const response = await api.post("/api/fusion/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.jobId) {
        setJobId(response.jobId);
        setJobStatus("pending");
        setJobProgress(0);
        setStep("generate");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.response?.data?.error || "Failed to create fusion job");
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Virtual Try-On</h1>
          <p className="text-muted-foreground">
            Upload a model image and fabric samples to see how they look together
          </p>
        </div>

        {/* Face Protection Notice */}
        {faceDetected && (
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Faces detected in your images. Your faces will be protected and remain unchanged.
              Please provide consent to proceed.
            </AlertDescription>
          </Alert>
        )}

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {(["upload", "options", "generate", "results"] as Step[]).map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : idx < (["upload", "options", "generate", "results"] as Step[]).indexOf(step)
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < 3 && <ChevronRight className="mx-2 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Model Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect("model", e.target.files[0])}
                  className="w-full"
                />
                {modelImage && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm">{modelImage.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFile("model")}>
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Top Fabric</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect("top", e.target.files[0])}
                  className="w-full"
                />
                {topFabric && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm">{topFabric.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFile("top")}>
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bottom Fabric</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect("bottom", e.target.files[0])}
                  className="w-full"
                />
                {bottomFabric && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm">{bottomFabric.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFile("bottom")}>
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GarmentCategory)}
                  className="w-full p-2 border rounded"
                >
                  <option value="other">Other</option>
                  <option value="dress">Dress</option>
                  <option value="top">Top</option>
                  <option value="skirt">Skirt</option>
                  <option value="lehenga">Lehenga</option>
                  <option value="blouse">Blouse</option>
                  <option value="gown">Gown</option>
                  <option value="saree">Saree</option>
                  <option value="salwar">Salwar</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={userConsent}
                  onChange={(e) => setUserConsent(e.target.checked)}
                />
                <label htmlFor="consent" className="text-sm">
                  I consent to image processing; faces will remain unchanged.
                </label>
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={!modelImage || (!topFabric && !bottomFabric)}>
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "generate" && (
          <Card>
            <CardHeader>
              <CardTitle>Generating Your Fusion</CardTitle>
            </CardHeader>
            <CardContent>
              <FusionProgress status={jobStatus} progress={jobProgress} error={jobError} />
              {jobError && (
                <Alert className="mt-4" variant="destructive">
                  <AlertDescription>{jobError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {step === "results" && jobResult && (
          <div className="space-y-6">
            <FusionResults
              job={{
                ...jobResult,
                status: "completed",
                candidates: jobResult.candidates || [],
              }}
            />
            <TryOnCanvas resultUrl={jobResult.resultUrl} />
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

