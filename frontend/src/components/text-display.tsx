"use client"

import { useState } from "react"
import { FileText, Copy, Download, Check } from "lucide-react"

interface TextDisplayProps {
  text: string
  fileName?: string
}

export default function TextDisplay({ text, fileName }: TextDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const downloadText = () => {
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileName || "extracted-text"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-cyan-400">Extracted Text</h2>
            {fileName && <span className="text-sm text-gray-400">from {fileName}</span>}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
              <span className="text-sm">{copied ? "Copied!" : "Copy"}</span>
            </button>

            <button
              onClick={downloadText}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Download</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="max-h-96 overflow-y-auto bg-black/50 rounded-xl p-4 border border-gray-800">
            <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed font-mono">{text}</pre>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
            <span>Characters: {text.length.toLocaleString()}</span>
            <span>
              Words:{" "}
              {text
                .split(/\s+/)
                .filter((word) => word.length > 0)
                .length.toLocaleString()}
            </span>
            <span>Lines: {text.split("\n").length.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
