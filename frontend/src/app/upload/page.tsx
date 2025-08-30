"use client"

import { useState } from "react"
import { Zap, FileText, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import UploadZone from "@/components/upload-zone"
import { uploadPDF, validatePDFFile } from "@/lib/upload-service"

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>("")
  const [uploadComplete, setUploadComplete] = useState(false)
  const router = useRouter()

  const handleUpload = async () => {
    if (!selectedFile) return

    const validation = validatePDFFile(selectedFile)
    if (!validation.isValid) {
      setError(validation.error || "Invalid file")
      return
    }

    setIsUploading(true)
    setError("")

    const result = await uploadPDF(selectedFile)

    if (result.success && result.full_text) {
      // Store extracted text and script in sessionStorage for next pages
      sessionStorage.setItem("extractedText", result.full_text)
      sessionStorage.setItem("podcastScript", result.podcast_script || "")
      setUploadComplete(true)

      // Redirect to options page after brief success display
      setTimeout(() => {
        router.push("/options")
      }, 1500)
    } else {
      setError(result.error || result.message || "Upload failed")
    }

    setIsUploading(false)
  }

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    if (error) {
      setError("")
    }
    setUploadComplete(false)
  }

  if (uploadComplete) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10" />
        <div className="relative z-10 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-400 mb-2">Upload Successful!</h2>
          <p className="text-gray-300">Processing your document...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <Zap className="w-6 h-6 text-cyan-400" />
          <span className="text-xl font-bold">Halo AI</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Upload Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Document</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Upload a PDF to extract content and create AI-powered experiences.
          </p>
        </div>

        {/* Upload Interface */}
        <div className="w-full max-w-2xl space-y-6">
          <UploadZone onFileSelect={handleFileSelect} selectedFile={selectedFile} />

          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => document.getElementById("fileUpload")?.click()}
              className="bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-gray-500"
            >
              {selectedFile ? "Change File" : "Choose PDF"}
            </Button>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
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
      </div>
    </div>
  )
}
