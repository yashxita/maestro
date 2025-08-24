import type { FileValidationResult, UploadResponse } from "./types"

export function validatePDFFile(file: File): FileValidationResult {
  if (file.type !== "application/pdf") {
    return { isValid: false, error: "Please select a PDF file" }
  }

  if (file.size > 10 * 1024 * 1024) {
    // 10MB limit
    return { isValid: false, error: "File size must be less than 10MB" }
  }

  return { isValid: true }
}

export async function uploadPDF(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append("file", file)

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    return await response.json()
  } catch (error) {
    return {
      success: false,
      message: "Upload failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
