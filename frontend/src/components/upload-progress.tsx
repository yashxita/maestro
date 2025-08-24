import type { UploadProgress } from "../lib/types/upload"

interface UploadProgressProps {
  progress: UploadProgress
  className?: string
}

export default function UploadProgressComponent({ progress, className = "" }: UploadProgressProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">Uploading...</span>
        <span className="text-cyan-400">{progress.percentage}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-400 text-center">
        {(progress.loaded / 1024 / 1024).toFixed(2)} MB / {(progress.total / 1024 / 1024).toFixed(2)} MB
      </div>
    </div>
  )
}
