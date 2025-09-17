export interface UploadResponse {
  success: boolean
  message?: string
  full_text?: string
  podcast_script?: string
  audio_url?: string
  error?: string
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface TTSRequest {
  text: string
  voice?: string
  speed?: number
}

export interface VoiceActor {
  id: string
  name: string
  description: string
  gender: "male" | "female"
  accent: string
  tags: string[]
  preview: string
}
