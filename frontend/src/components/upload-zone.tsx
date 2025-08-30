"use client"

import type React from "react"

import { useCallback } from "react"
import { Upload, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UploadZoneProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
}

export default function UploadZone({ onFileSelect, selectedFile }: UploadZoneProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files)
      const pdfFile = files.find((file) => file.type === "application/pdf")
      if (pdfFile) {
        onFileSelect(pdfFile)
      }
    },
    [onFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && file.type === "application/pdf") {
        onFileSelect(file)
      }
      // Reset input value to allow selecting the same file again
      e.target.value = ""
    },
    [onFileSelect],
  )

  const handleRemoveFile = useCallback(() => {
    onFileSelect(null)
  }, [onFileSelect])

  return (
    <div className="w-full">
      <input id="fileUpload" type="file" accept=".pdf" onChange={handleFileInput} className="hidden" />

      {selectedFile ? (
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-cyan-400" />
              <div>
                <p className="font-semibold text-white">{selectedFile.name}</p>
                <p className="text-sm text-gray-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-600 rounded-2xl p-12 text-center bg-gray-900/50 backdrop-blur-sm hover:border-cyan-500/50 transition-colors cursor-pointer"
          onClick={() => document.getElementById("fileUpload")?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Drop your PDF here or click to browse</h3>
          <p className="text-gray-400 text-sm">Supports PDF files up to 10MB</p>
        </div>
      )}
    </div>
  )
}
