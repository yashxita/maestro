import type { VoiceActor } from "@/lib/types/podcast"

export const voiceActors: VoiceActor[] = [
  {
    id: "host",
    name: "Brian (Host)",
    description: "Professional male voice for podcast host",
    gender: "male",
    accent: "US",
    tags: ["professional", "clear", "male", "host"],
    preview: "Welcome to the podcast! I'm your host, ready to guide you through today's discussion.",
  },
  {
    id: "guest",
    name: "Amy (Guest)",
    description: "Engaging female voice for podcast guest",
    gender: "female",
    accent: "UK",
    tags: ["engaging", "conversational", "female", "guest"],
    preview: "Hi everyone! I'm excited to share my insights and join this conversation.",
  },
]

export const VOICE_ACTORS = voiceActors

export const SPEED_OPTIONS = [
  { value: 0.8, label: "Slow (0.8x)" },
  { value: 1.0, label: "Normal (1.0x)" },
  { value: 1.25, label: "Fast (1.25x)" },
]
