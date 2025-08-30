"use client"

import { useState, useRef } from "react"
import { Zap, FileText, Loader2, Mic, Play, Download } from "lucide-react"
import UploadZone from "./upload-zone"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { uploadPDF, validatePDFFile } from "../lib/upload-service"
import { voiceActors, type VoiceActor } from "../lib/voice-actors"

export default function PDFUploadInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [extractedText, setExtractedText] = useState<string>("")
  const [podcastScript, setPodcastScript] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [audioURL, setAudioURL] = useState<string>("")
  const [speed, setSpeed] = useState<"slow" | "normal" | "fast">("normal")
  const [selectedVoice, setSelectedVoice] = useState<VoiceActor>(voiceActors[0])
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

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
      setError(result.error || result.message || "Upload failed")
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

  const handleGenerateAudio = async () => {
    if (!podcastScript) return

    setIsGeneratingAudio(true)
    setError("")

    try {
      const res = await fetch("/api/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: podcastScript,
          voice: selectedVoice.id, // Now "host" or "guest"
          speed: speed === "slow" ? 0.8 : speed === "fast" ? 1.25 : 1.0,
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setAudioURL(url)

      if (audioRef.current) {
        audioRef.current.load()
        audioRef.current.play()
      }
    } catch (error) {
      console.error("Audio generation failed:", error)
      setError("Failed to generate audio. Please try again.")
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const handleVoicePreview = async (voice: VoiceActor) => {
    try {
      const res = await fetch("/api/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: voice.preview,
          voice: voice.id,
          speed: 1.0,
        }),
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.play()
      }
    } catch (error) {
      console.error("Voice preview failed:", error)
    }
  }

  const handleDownload = () => {
    if (audioURL) {
      const a = document.createElement("a")
      a.href = audioURL
      a.download = `podcast-${selectedVoice.name.toLowerCase()}-${Date.now()}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
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

                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-purple-400">Choose Voice (Host/Guest)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {voiceActors.map((voice) => (
                      <div
                        key={voice.id}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedVoice.id === voice.id
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                        }`}
                        onClick={() => setSelectedVoice(voice)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{voice.name}</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVoicePreview(voice)
                            }}
                            className="h-8 w-8 p-0 hover:bg-purple-500/20"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{voice.description}</p>
                        <div className="flex gap-1">
                          {voice.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-sm text-blue-200">
                      💡 <strong>Tip:</strong> The system will automatically use both voices in your podcast - Brian
                      (male) for host segments and Amy (female) for guest segments. Your selection here determines the
                      primary voice for single-speaker content.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-4">
                  {/* Speed Selector */}
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-400 self-center mr-2">Speed:</span>
                    {["slow", "normal", "fast"].map((s) => (
                      <Button
                        key={s}
                        variant={speed === s ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSpeed(s as "slow" | "normal" | "fast")}
                        className={speed === s ? "bg-purple-700 text-white" : "bg-gray-800 text-gray-300"}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>

                  {/* Generate Audio Button */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingAudio}
                      className="bg-purple-700 hover:bg-purple-600 border-purple-500 text-white flex-1"
                    >
                      {isGeneratingAudio ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Multi-Voice Audio...
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Generate Podcast Audio
                        </>
                      )}
                    </Button>

                    {audioURL && (
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="bg-gray-800 hover:bg-gray-700 border-gray-600"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Audio Player */}
                  {audioURL && (
                    <div className="bg-black/50 rounded-xl p-4 border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Multi-voice podcast with Brian & Amy</span>
                        <span className="text-xs text-gray-500">Speed: {speed}</span>
                      </div>
                      <audio ref={audioRef} controls className="w-full">
                        <source src={audioURL} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
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
