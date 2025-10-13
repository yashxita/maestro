"use client"

import { Bot, User, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  type: "bot" | "user" | "file"
  content?: string
  fileName?: string
  fileSize?: number
}

export function ChatMessage({ type, content, fileName, fileSize }: ChatMessageProps) {
  const isBot = type === "bot"
  const isFile = type === "file"

  if (isFile) {
    return (
      <div className="flex justify-end">
        <div className="bg-cyan-600/20 border border-cyan-500/30 rounded-2xl p-4 max-w-md">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-cyan-400" />
            <div>
              <p className="font-semibold text-white">{fileName}</p>
              <p className="text-sm text-gray-400">{fileSize ? (fileSize / (1024 * 1024)).toFixed(2) : 0} MB</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-3", isBot ? "justify-start" : "justify-end")}>
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-2xl",
          isBot
            ? "bg-gray-800/50 border border-gray-700/50 text-gray-100"
            : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white",
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
      {!isBot && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  )
}
