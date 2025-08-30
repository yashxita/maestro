"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, Headphones, Download, Play, Pause } from "lucide-react"
import { VoiceSelector } from "../components/voice-selector"
import type { UploadResponse, UploadProgress } from "../lib/types/podcast"

export function PodcastGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [extractedText, setExtractedText] = useState("")
  const [podcastScript, setPodcastScript] = useState("")
  const [selectedVoice, setSelectedVoice] = useState("Puck")
  const [selectedSpeed, setSelectedSpeed] = useState(1.0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    setExtractedText("")
    setPodcastScript("")
    setAudioUrl(null)
  }

  const handleUpload = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      setUploadProgress({ loaded: 0, total: 100, percentage: 0 })

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result: UploadResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      setExtractedText(result.full_text || "")
      setPodcastScript(result.podcast_script || "")
      setUploadProgress(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed")
      setUploadProgress(null)
    }
  }

  const handleGenerateAudio = async () => {
    if (!podcastScript) return

    setIsGeneratingAudio(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: podcastScript,
          voice: selectedVoice,
          speed: selectedSpeed,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate audio")
      }

      const audioBlob = await response.blob()
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Audio generation failed")
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleDownload = () => {
    if (!audioUrl) return

    const a = document.createElement("a")
    a.href = audioUrl
    a.download = `podcast-${selectedVoice}-${selectedSpeed}x.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload PDF Document
          </CardTitle>
          <CardDescription>Upload a PDF file to extract text and generate a podcast script</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) handleFileSelect(selectedFile)
              }}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <FileText className="h-4 w-4 mr-2" />
              Choose PDF File
            </Button>
            {file && (
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
          </div>

          {file && (
            <Button onClick={handleUpload} disabled={!!uploadProgress}>
              {uploadProgress ? "Processing..." : "Extract Text & Generate Script"}
            </Button>
          )}

          {uploadProgress && <Progress value={uploadProgress.percentage} className="w-full" />}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Extracted Text */}
      {extractedText && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Text</CardTitle>
            <CardDescription>Text extracted from your PDF document</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </CardContent>
        </Card>
      )}

      {/* Podcast Script */}
      {podcastScript && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Podcast Script</CardTitle>
            <CardDescription>AI-generated podcast script from your content</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={podcastScript}
              onChange={(e) => setPodcastScript(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </CardContent>
        </Card>
      )}

      {/* Voice Selection */}
      {podcastScript && (
        <VoiceSelector
          selectedVoice={selectedVoice}
          selectedSpeed={selectedSpeed}
          onVoiceChange={setSelectedVoice}
          onSpeedChange={setSelectedSpeed}
        />
      )}

      {/* Audio Generation */}
      {podcastScript && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" />
              Generate Audio
            </CardTitle>
            <CardDescription>Convert your podcast script to audio using the selected voice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGenerateAudio} disabled={isGeneratingAudio} className="w-full">
              {isGeneratingAudio ? "Generating Audio..." : "Generate Podcast Audio"}
            </Button>

            {audioUrl && (
              <div className="space-y-4">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handlePlayPause}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>

                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download MP3
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
