"use client"

import { useState, useCallback } from "react"
import { UploadService } from "../lib/services/uploadService"
import type { UploadProgress } from "../lib/types/upload"

interface UseUploadState {
  isUploading: boolean
  progress: UploadProgress | null
  error: string | null
  extractedText: string
}

export function useUpload() {
  const [state, setState] = useState<UseUploadState>({
    isUploading: false,
    progress: null,
    error: null,
    extractedText: "",
  })

  const uploadFile = useCallback(async (file: File) => {
    setState((prev) => ({
      ...prev,
      isUploading: true,
      error: null,
      progress: null,
    }))

    try {
      const result = await UploadService.uploadFileWithProgress(file, (progress) => {
        setState((prev) => ({
          ...prev,
          progress,
        }))
      })

      if (result.success) {
        setState((prev) => ({
          ...prev,
          isUploading: false,
          extractedText: result.full_text || "",
          progress: null,
        }))
      } else {
        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: result.error || "Upload failed",
          progress: null,
        }))
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: "An unexpected error occurred",
        progress: null,
      }))
    }
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const clearText = useCallback(() => {
    setState((prev) => ({ ...prev, extractedText: "" }))
  }, [])

  return {
    ...state,
    uploadFile,
    clearError,
    clearText,
  }
}
