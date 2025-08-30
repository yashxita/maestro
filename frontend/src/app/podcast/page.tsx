"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Zap, Play, Pause, SkipBack, SkipForward, Volume2, FileText, ArrowLeft, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PodcastPage() {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement>(null)

  const [extractedText, setExtractedText] = useState<string>("")
  const [podcastScript, setPodcastScript] = useState<string>("")
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([75])
  const [playbackRate, setPlaybackRate] = useState([1])
  const [showScript, setShowScript] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // Get data from sessionStorage
    const storedText = sessionStorage.getItem("extractedText")
    const storedScript = sessionStorage.getItem("podcastScript")

    if (!storedText || !storedScript) {
      router.push("/upload")
      return
    }

    setExtractedText(storedText)
    setPodcastScript(storedScript)

    // Auto-generate audio when page loads
    generateAudio(storedScript)
  }, [router])

  const generateAudio = async (script: string) => {
    setIsGeneratingAudio(true)
    setError("")

    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: script,
          voice: "host", // Use both host and guest voices
          speed: playbackRate[0],
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
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100
    }
  }

  const handleSpeedChange = (value: number[]) => {
    setPlaybackRate(value)
    if (audioRef.current) {
      audioRef.current.playbackRate = value[0]
    }
  }

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
    }
  }

  const handleDownload = () => {
    if (!audioUrl) return

    const a = document.createElement("a")
    a.href = audioUrl
    a.download = `podcast-${Date.now()}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-300 hover:text-cyan-400">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            <span className="text-xl font-bold">Podcast Player</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 py-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Audio Generation Loading */}
          {isGeneratingAudio && (
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-cyan-400" />
              <h2 className="text-xl font-semibold text-cyan-400 mb-2">Generating Your Podcast</h2>
              <p className="text-gray-300">Creating multi-voice audio with Brian (Host) and Amy (Guest)...</p>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && !isGeneratingAudio && (
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  Your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span>{" "}
                  Podcast
                </h1>
                <p className="text-gray-300">Multi-voice conversation with Brian & Amy</p>
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              {/* Progress Bar */}
              <div className="mb-6">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSkip(-10)}
                  className="text-gray-300 hover:text-cyan-400"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>

                <Button
                  onClick={handlePlayPause}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 w-16 h-16 rounded-full"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSkip(10)}
                  className="text-gray-300 hover:text-cyan-400"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </div>

              {/* Volume and Speed Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-5 h-5 text-gray-400" />
                  <Slider value={volume} max={100} step={1} onValueChange={handleVolumeChange} className="flex-1" />
                  <span className="text-sm text-gray-400 w-12">{volume[0]}%</span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400">Speed:</span>
                  <Slider
                    value={playbackRate}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onValueChange={handleSpeedChange}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-400 w-12">{playbackRate[0]}x</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => setShowScript(!showScript)}
                  variant="outline"
                  className="bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-gray-500"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {showScript ? "Hide Script" : "View Script"}
                </Button>

                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-gray-500"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download MP3
                </Button>
              </div>
            </div>
          )}

          {/* Script Display */}
          {showScript && podcastScript && (
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold text-purple-400">Podcast Script</h2>
                </div>
                <div className="text-sm text-gray-400">{podcastScript.length} characters</div>
              </div>
              <div className="max-h-96 overflow-y-auto bg-black/50 rounded-xl p-4 border border-gray-800">
                <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">{podcastScript}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
