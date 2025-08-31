"use client";

import { useState } from "react";
import { Zap, FileText, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import UploadZone from "@/components/upload-zone";
import { uploadPDF, validatePDFFile } from "@/lib/upload-service";
import Plasma from "../../components/Plasma";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [uploadComplete, setUploadComplete] = useState(false);
  const router = useRouter();

  const handleUpload = async () => {
    if (!selectedFile) return;

    const validation = validatePDFFile(selectedFile);
    if (!validation.isValid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const result = await uploadPDF(selectedFile);

      if (result.success && result.full_text) {
        sessionStorage.setItem("extractedText", result.full_text);
        sessionStorage.setItem("podcastScript", result.podcast_script || "");
        setUploadComplete(true);

        setTimeout(() => {
          router.push("/options");
        }, 1500);
      } else {
        setError(result.error || result.message || "Upload failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (error) setError("");
    setUploadComplete(false);
  };

  // ✅ Success screen
  if (uploadComplete) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
         <div className="absolute inset-0 z-0">
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <Plasma
          color="#00E5FF"
          speed={0.6}
          direction="forward"
          scale={1.9}
          opacity={0.5}
          mouseInteractive={false}
        />
        </div>
        </div>
        <div className="relative z-10 text-center px-4">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl md:text-3xl font-bold text-green-400 mb-2">
            Upload Successful!
          </h2>
          <p className="text-gray-300">Processing your document...</p>
        </div>
      </div>
    );
  }

  // ✅ Upload screen
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 z-0">
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        <Plasma
          color="#00E5FF"
          speed={0.6}
          direction="forward"
          scale={1.9}
          opacity={0.5}
          mouseInteractive={false}
        />
      </div>
</div>
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-6 h-6 text-cyan-400" />
          <span className="text-xl font-bold tracking-wide">Maestro</span>
        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 py-12">
        <div className="text-center max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Upload Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Document
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10">
            Turn your PDFs into AI-powered experiences in just a few clicks.
          </p>
        </div>

        {/* Upload Zone */}
        <div className="w-full max-w-2xl space-y-6">
          <UploadZone
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />

          {error && (
            <Alert
              variant="destructive"
              className="bg-red-900/20 border-red-500/50"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => document.getElementById("fileUpload")?.click()}
              className="bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-gray-500 transition-colors"
            >
              {selectedFile ? "Change File" : "Choose PDF"}
            </Button>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Extract Content
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
