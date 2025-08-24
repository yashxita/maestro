import type { UploadResponse, UploadProgress } from "../types/upload"
import { FileValidationService } from "./fileValidation"

export class UploadService {
  private static readonly API_ENDPOINT = "/api/upload"

  static async uploadFile(file: File, onProgress?: (progress: UploadProgress) => void): Promise<UploadResponse> {
    // Validate file first
    const validation = FileValidationService.validateFile(file)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || `Upload failed with status ${response.status}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        full_text: data.full_text,
      }
    } catch (error) {
      console.error("Upload error:", error)
      return {
        success: false,
        error: "Network error occurred during upload",
      }
    }
  }

  static async uploadFileWithProgress(
    file: File,
    onProgress: (progress: UploadProgress) => void,
  ): Promise<UploadResponse> {
    // Validate file first
    const validation = FileValidationService.validateFile(file)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append("file", file)

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          }
          onProgress(progress)
        }
      })

      xhr.addEventListener("load", async () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve({
              success: true,
              full_text: data.full_text,
            })
          } catch (error) {
            resolve({
              success: false,
              error: "Failed to parse response",
            })
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText)
            resolve({
              success: false,
              error: errorData.error || `Upload failed with status ${xhr.status}`,
            })
          } catch {
            resolve({
              success: false,
              error: `Upload failed with status ${xhr.status}`,
            })
          }
        }
      })

      xhr.addEventListener("error", () => {
        resolve({
          success: false,
          error: "Network error occurred during upload",
        })
      })

      xhr.open("POST", this.API_ENDPOINT)
      xhr.send(formData)
    })
  }
}
