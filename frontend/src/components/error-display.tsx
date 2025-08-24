"use client"

import { AlertCircle, X } from "lucide-react"

interface ErrorDisplayProps {
  error: string
  onDismiss: () => void
  className?: string
}

export default function ErrorDisplay({ error, onDismiss, className = "" }: ErrorDisplayProps) {
  return (
    <div className={`bg-red-900/20 border border-red-500/30 rounded-xl p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
        <button onClick={onDismiss} className="text-red-400 hover:text-red-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
