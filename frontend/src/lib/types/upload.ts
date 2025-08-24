export interface UploadResponse {
  success: boolean
  full_text?: string
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
