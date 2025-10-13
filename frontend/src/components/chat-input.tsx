"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Send, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onFileUpload: (file: File) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, onFileUpload, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message)
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file)
      e.target.value = ""
    }
  }

  return (
    <div className="flex items-end gap-2">
      <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
      <Button
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-cyan-500/50 flex-shrink-0"
      >
        <Paperclip className="w-5 h-5 text-gray-400" />
      </Button>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message or upload a PDF..."
        disabled={disabled}
        className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 resize-none min-h-[52px] max-h-32"
        rows={1}
      />
      <Button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 flex-shrink-0"
        size="icon"
      >
        <Send className="w-5 h-5" />
      </Button>
    </div>
  )
}
