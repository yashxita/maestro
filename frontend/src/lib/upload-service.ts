import type { UploadResponse, FileValidationResult } from "../lib/types/upload"
export function validatePDFFile(file: File): FileValidationResult {
  // Check file type
  if (file.type !== "application/pdf") {
    return {
      isValid: false,
      error: "Only PDF files are allowed",
    }
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size must be less than 10MB",
    }
  }

  // Check if file name is reasonable
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: "File name is too long",
    }
  }

  return { isValid: true }
}

export async function uploadPDF(file: File): Promise<UploadResponse> {
  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`/api/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`,
      }
    }

    const result = (await response.json()) as UploadResponse
return result
    
  } catch (error) {
    console.error("Upload error:", error)
    return {
      success: false,
      error: "Network error. Please check your connection and try again.",
    }
  }
}
