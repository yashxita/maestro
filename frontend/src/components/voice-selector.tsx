"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Volume2 } from "lucide-react"
import { VOICE_ACTORS, SPEED_OPTIONS } from "@/lib/voice-actors"
import type { VoiceActor } from "@/lib/types/podcast"

interface VoiceSelectorProps {
  selectedVoice: string
  selectedSpeed: number
  onVoiceChange: (voice: string) => void
  onSpeedChange: (speed: number) => void
  sampleText?: string
}

export function VoiceSelector({
  selectedVoice,
  selectedSpeed,
  onVoiceChange,
  onSpeedChange,
  sampleText = "Hello! This is a sample of how I sound when reading your podcast script.",
}: VoiceSelectorProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({})

  const handlePlaySample = async (voice: VoiceActor) => {
    if (playingVoice === voice.id) {
      // Stop current audio
      if (audioElements[voice.id]) {
        audioElements[voice.id].pause()
        audioElements[voice.id].currentTime = 0
      }
      setPlayingVoice(null)
      return
    }

    try {
      setPlayingVoice(voice.id)

      // Generate audio sample
      const response = await fetch(`/api/generate-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sampleText,
          voice: voice.id,
          speed: selectedSpeed,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate audio sample")
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // Create or reuse audio element
      let audio = audioElements[voice.id]
      if (!audio) {
        audio = new Audio()
        setAudioElements((prev) => ({ ...prev, [voice.id]: audio }))
      }

      audio.src = audioUrl
      audio.onended = () => {
        setPlayingVoice(null)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error("Error playing sample:", error)
      setPlayingVoice(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice & Speed Settings
        </CardTitle>
        <CardDescription>Choose a voice actor and playback speed for your podcast</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Speed Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Playback Speed</label>
          <Select value={selectedSpeed.toString()} onValueChange={(value) => onSpeedChange(Number.parseFloat(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEED_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Voice Actor Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Voice Actor</label>
          <div className="grid gap-3">
            {VOICE_ACTORS.map((voice) => (
              <Card
                key={voice.id}
                className={`cursor-pointer transition-colors ${
                  selectedVoice === voice.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => onVoiceChange(voice.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{voice.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {voice.gender}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {voice.accent}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{voice.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlaySample(voice)
                      }}
                      disabled={playingVoice !== null && playingVoice !== voice.id}
                    >
                      {playingVoice === voice.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
