"use client"

import type React from "react"

import { useState, type DragEvent } from "react"
import { Upload, FileText, X } from "lucide-react"

interface UploadZoneProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  className?: string
}

export default function UploadZone({ onFileSelect, selectedFile, className = "" }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === "application/pdf") {
        onFileSelect(file)
      } else {
        alert("Please select a PDF file")
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const removeFile = () => {
    onFileSelect(null)
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`relative p-12 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300 backdrop-blur-sm
          ${
            dragActive
              ? "border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/25"
              : selectedFile
                ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/25"
                : "border-gray-600 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-900/70"
          }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById("fileUpload")?.click()}
      >
        <div className="flex flex-col items-center space-y-4">
          {selectedFile ? (
            <>
              <FileText className="w-16 h-16 text-blue-400" />
              <div>
                <p className="text-lg font-semibold text-blue-400">{selectedFile.name}</p>
                <p className="text-sm text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile()
                }}
                className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </>
          ) : (
            <>
              <Upload className="w-16 h-16 text-gray-400" />
              <div>
                <p className="text-lg font-semibold text-gray-300">Drop your PDF here</p>
                <p className="text-sm text-gray-500">or click to browse files</p>
                <p className="text-xs text-gray-600 mt-2">Maximum file size: 10MB</p>
              </div>
            </>
          )}
        </div>
      </div>

      <input type="file" accept=".pdf" id="fileUpload" onChange={handleFileInput} className="hidden" />
    </div>
  )
}
