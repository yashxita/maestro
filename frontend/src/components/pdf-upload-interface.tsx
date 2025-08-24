"use client"

import { useState } from "react"
import { Zap, FileText, Loader2, Mic } from "lucide-react"
import UploadZone from "@/components/upload-zone"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { uploadPDF, validatePDFFile } from "@/lib/upload-service"

export default function PDFUploadInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [extractedText, setExtractedText] = useState<string>("")
  const [podcastScript, setPodcastScript] = useState<string>("")
  const [error, setError] = useState<string>("")

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
      setExtractedText(result.full_text)
      setPodcastScript(result.podcast_script || "")
    } else {
      setError(result.error || result.message)
    }

    setIsUploading(false)
  }

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    if (!file) {
      setExtractedText("")
      setPodcastScript("")
    }
    if (error) {
      setError("")
    }
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
          <span className="text-xl font-bold">Halo</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">
            services
          </a>
          <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">
            process
          </a>
          <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">
            team
          </a>
          <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">
            pricing
          </a>
          <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">
            FAQ
          </a>
          <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">
            contact
          </a>
        </div>
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
          get this template
        </button>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            PDF <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span>{" "}
            studio.
          </h1>
          <p className="text-xl text-gray-300 mb-8">Extract and analyze text from PDFs with advanced AI processing.</p>
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
                "Extract Text"
              )}
            </Button>
          </div>
        </div>

        {extractedText && (
          <div className="mt-12 w-full max-w-4xl space-y-8">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-semibold text-cyan-400">Extracted Text</h2>
                </div>
                <div className="text-sm text-gray-400">{extractedText.length} characters</div>
              </div>
              <div className="max-h-96 overflow-y-auto bg-black/50 rounded-xl p-4 border border-gray-800">
                <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">{extractedText}</pre>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(extractedText)}
                  className="bg-gray-800 hover:bg-gray-700 border-gray-600"
                >
                  Copy Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExtractedText("")}
                  className="bg-gray-800 hover:bg-gray-700 border-gray-600"
                >
                  Clear
                </Button>
              </div>
            </div>

            {podcastScript && (
  <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <Mic className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-semibold text-purple-400">Podcast Script</h2>
      </div>
      <div className="text-sm text-gray-400">{podcastScript.length} characters</div>
    </div>
    <div className="max-h-96 overflow-y-auto bg-black/50 rounded-xl p-4 border border-gray-800">
      <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">{podcastScript}</pre>
    </div>
    <div className="mt-4 flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigator.clipboard.writeText(podcastScript)}
        className="bg-gray-800 hover:bg-gray-700 border-gray-600"
      >
        Copy Script
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPodcastScript("")}
        className="bg-gray-800 hover:bg-gray-700 border-gray-600"
      >
        Clear
      </Button>

      {/* NEW: Play Podcast */}
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          const formData = new FormData()
          formData.append("text", podcastScript)
          const res = await fetch("http://127.0.0.1:8000/audio", {
            method: "POST",
            body: formData,
          })
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audio.play()
        }}
        className="bg-purple-700 hover:bg-purple-600 border-purple-500 text-white"
      >
        ▶ Play Podcast
      </Button>
    </div>
  </div>
)}

          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-16 text-center pb-8">
        <p className="text-gray-500 text-sm">We develop custom AI solutions for innovative companies.</p>
      </footer>
    </div>
  )
}
