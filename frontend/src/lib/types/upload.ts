export interface UploadResponse {
  success: boolean
  full_text?: string
  podcast_script?: string   // ✅ add this
  message?: string          // ✅ add this
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
