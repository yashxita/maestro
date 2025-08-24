export interface UploadResponse {
  success: boolean
  message: string
  full_text?: string
  podcast_script?: string
  error?: string
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
}
