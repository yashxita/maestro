"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  FileText,
  ArrowLeft,
  Download,
  Loader2,
  Shuffle,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Aurora from "@/components/Aurora";

export default function PodcastPage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [extractedText, setExtractedText] = useState<string>("");
  const [podcastScript, setPodcastScript] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [playbackRate, setPlaybackRate] = useState([1]);
  const [showScript, setShowScript] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Get data from sessionStorage
    const storedText = sessionStorage.getItem("extractedText");
    const storedScript = sessionStorage.getItem("podcastScript");

    if (!storedText || !storedScript) {
      router.push("/upload");
      return;
    }

    setExtractedText(storedText);
    setPodcastScript(storedScript);

    // Auto-generate audio when page loads
    generateAudio(storedScript);
  }, [router]);

  const generateAudio = async (script: string) => {
    setIsGeneratingAudio(true);
    setError("");

    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: script,
          voice: "host", // Use both host and guest voices
          speed: playbackRate[0],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Audio generation failed"
      );
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
  };

  const handleSpeedChange = (value: number[]) => {
    setPlaybackRate(value);
    if (audioRef.current) {
      audioRef.current.playbackRate = value[0];
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(duration, currentTime + seconds)
      );
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `podcast-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const circumference = 2 * Math.PI * 120; // radius of 120
  const strokeDashoffset =
    circumference - (progressPercentage / 100) * circumference;

  const handleProgressRingClick = (event: React.MouseEvent<SVGElement>) => {
    if (!audioRef.current || duration === 0) return;

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate angle from center to click point
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    let angle = Math.atan2(y, x) * (180 / Math.PI);

    // Adjust angle to start from top (12 o'clock position) and go clockwise
    angle = (angle + 90 + 360) % 360;

    // Convert angle to time position
    const newTime = (angle / 360) * duration;

    // Update audio position
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-black" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute inset-0 z-0  opacity-50">
      <Aurora
        colorStops={["#00F0FF", "#1D4ED8", "#3B82F6"]}

        blend={1}
        amplitude={1.0}
        speed={0.5}
      />
      </div>
      
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-300 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            <span className="text-xl font-bold">AI Podcast</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-8">
        <div className="w-full max-w-6xl">
          {/* Error Display */}
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-900/20 border-red-500/50 mb-8"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Audio Generation Loading */}
          {isGeneratingAudio && (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-12 shadow-2xl text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-6 animate-spin text-cyan-400" />
              <h2 className="text-2xl font-semibold text-cyan-400 mb-3">
                Generating Your Podcast
              </h2>
              <p className="text-gray-300">
                Creating multi-voice audio with Brian (Host) and Amy (Guest)...
              </p>
            </div>
          )}

          {audioUrl && !isGeneratingAudio && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Left Side - Track Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Daily Mix</h1>
                  <h2 className="text-4xl font-bold mb-4">
                    Your{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                      AI
                    </span>{" "}
                    Podcast
                  </h2>
                  <p className="text-gray-400">Future Funk • Scott</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatTime(duration)}
                  </p>
                </div>

                {/* Volume and Speed Controls */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <Slider
                      value={volume}
                      max={100}
                      step={1}
                      onValueChange={handleVolumeChange}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-400 w-8">
                      {volume[0]}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400">Speed:</span>
                    <Slider
                      value={playbackRate}
                      min={0.5}
                      max={2}
                      step={0.1}
                      onValueChange={handleSpeedChange}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-400 w-8">
                      {playbackRate[0]}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Center - Circular Disc Player */}
              <div className="flex flex-col items-center space-y-8">
                <div className="relative">
                  {/* Outer glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-xl scale-110"></div>

                  {/* Progress ring */}
                  <svg
                    className="w-80 h-80 transform -rotate-90 cursor-pointer"
                    viewBox="0 0 240 240"
                    onClick={handleProgressRingClick}
                  >
                    {/* Background circle */}
                    <circle
                      cx="120"
                      cy="120"
                      r="120"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="2"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="120"
                      cy="120"
                      r="120"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 ease-out hover:stroke-[4]"
                    />
                    {/* Invisible clickable ring for better UX */}
                    <circle
                      cx="120"
                      cy="120"
                      r="120"
                      stroke="transparent"
                      strokeWidth="20"
                      fill="none"
                      className="hover:stroke-white/10 transition-colors cursor-pointer"
                    />
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Inner disc */}
                  <div className="absolute inset-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full shadow-2xl border border-slate-700/50">
                    <div className="absolute inset-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center">
                      {/* Album art placeholder */}
                      <div className="w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 bg-slate-700 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={handlePlayPause}
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 w-20 h-20 rounded-full transition-all duration-300 hover:scale-105"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8" />
                      ) : (
                        <Play className="w-8 h-8 ml-1" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Transport Controls */}
                <div className="flex items-center space-x-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    <Shuffle className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSkip(-10)}
                    className="text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    <SkipBack className="w-6 h-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSkip(10)}
                    className="text-gray-300 hover:text-cyan-400 transition-colors"
                  >
                    <SkipForward className="w-6 h-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    <Repeat className="w-5 h-5" />
                  </Button>
                </div>

                {/* Time display */}
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-gray-300 mb-1">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTime(duration)}
                  </div>
                </div>
              </div>

              {/* Right Side - Playlist/Actions */}
              <div className="space-y-4">
                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowScript(!showScript)}
                    variant="outline"
                    className="w-full bg-slate-800/50 hover:bg-slate-700/50 border-slate-600/50 hover:border-cyan-400/50 transition-all"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {showScript ? "Hide Script" : "View Script"}
                  </Button>

                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="w-full bg-slate-800/50 hover:bg-slate-700/50 border-slate-600/50 hover:border-purple-400/50 transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download MP3
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Script Display */}
          {showScript && podcastScript && (
            <div className="mt-8 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-2xl font-semibold text-cyan-400">
                    Podcast Script
                  </h2>
                </div>
                <div className="text-sm text-gray-400">
                  {podcastScript.length} characters
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto bg-black/50 rounded-2xl p-6 border border-slate-800/50">
                <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed font-mono">
                  {podcastScript}
                </pre>
              </div>
            </div>
          )}

          {audioUrl && (<audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />)}
        </div>
      </div>
      <div className="absolute inset-0 z-0 scale-y-[-1] opacity-50">
      <Aurora
        colorStops={["#00F0FF", "#1D4ED8", "#3B82F6"]}

        blend={1}
        amplitude={1.0}
        speed={0.5}
      />
      </div>
    </div>
  );
}
