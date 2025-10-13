"use client"

import { useState, useRef, useEffect } from "react"
import { Zap, Sparkles, Mic, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { ProcessingCard } from "@/components/processing-card"
import { CompletedCard } from "@/components/completed-card"
import { ChatSidebar } from "@/components/chat-sidebar"
import Plasma from "@/components/Plasma"

interface Message {
  id: string
  type: "bot" | "user" | "file" | "processing" | "options" | "completed"
  content?: string
  fileName?: string
  fileSize?: number
  options?: { quiz: boolean; podcast: boolean }
  results?: { quiz?: any; podcast?: any }
}

export function ChatPage() {
  const [currentChatId, setCurrentChatId] = useState("current")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Welcome to Maestro! I'm your AI assistant for transforming PDFs into interactive experiences.",
    },
    {
      id: "2",
      type: "bot",
      content:
        "You can upload a PDF document, and I'll help you create:\n\n📝 **Interactive Quiz** - Test your knowledge with AI-generated questions\n🎙️ **AI Podcast** - Listen to an engaging conversation about your content\n\nJust upload a PDF to get started!",
    },
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId)
    // TODO: Load chat history from S3 based on chatId
    console.log("[v0] Selected chat:", chatId)
  }

  const handleNewChat = () => {
    setCurrentChatId(`chat-${Date.now()}`)
    setMessages([
      {
        id: "1",
        type: "bot",
        content: "Welcome to Maestro! I'm your AI assistant for transforming PDFs into interactive experiences.",
      },
      {
        id: "2",
        type: "bot",
        content:
          "You can upload a PDF document, and I'll help you create:\n\n📝 **Interactive Quiz** - Test your knowledge with AI-generated questions\n🎙️ **AI Podcast** - Listen to an engaging conversation about your content\n\nJust upload a PDF to get started!",
      },
    ])
    setUploadedFile(null)
  }

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "bot",
          content: "Please upload a PDF file.",
        },
      ])
      return
    }

    setUploadedFile(file)

    // Add user file message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "file",
        fileName: file.name,
        fileSize: file.size,
      },
    ])

    // Add bot processing message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "bot",
        content: "Great! I've received your PDF. Processing the content...",
      },
    ])

    // Add processing card
    const processingId = Date.now().toString()
    setMessages((prev) => [
      ...prev,
      {
        id: processingId,
        type: "processing",
      },
    ])

    setIsProcessing(true)

    try {
      // Upload and extract text
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const result = await response.json()

      // Store extracted text
      sessionStorage.setItem("extractedText", result.full_text)
      sessionStorage.setItem("podcastScript", result.podcast_script || "")

      // Remove processing message
      setMessages((prev) => prev.filter((msg) => msg.id !== processingId))

      // Add success message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "bot",
          content: "Perfect! Your document has been processed. What would you like to create?",
        },
      ])

      // Add options
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "options",
          options: { quiz: false, podcast: false },
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "bot",
          content: "Sorry, there was an error processing your file. Please try again.",
        },
      ])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOptionSelect = async (option: "quiz" | "podcast" | "both") => {
    // Remove options message
    setMessages((prev) => prev.filter((msg) => msg.type !== "options"))

    const selectedOptions = {
      quiz: option === "quiz" || option === "both",
      podcast: option === "podcast" || option === "both",
    }

    // Add user selection message
    const optionText = option === "both" ? "both Quiz and Podcast" : option === "quiz" ? "Quiz" : "Podcast"
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "user",
        content: `I'd like to create ${optionText}`,
      },
    ])

    // Add bot confirmation
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "bot",
        content: `Excellent choice! I'm generating your ${optionText} now...`,
      },
    ])

    // Add processing cards
    const processingIds: string[] = []
    if (selectedOptions.quiz) {
      const quizId = `quiz-${Date.now()}`
      processingIds.push(quizId)
      setMessages((prev) => [
        ...prev,
        {
          id: quizId,
          type: "processing",
          content: "quiz",
        },
      ])
    }
    if (selectedOptions.podcast) {
      const podcastId = `podcast-${Date.now()}`
      processingIds.push(podcastId)
      setMessages((prev) => [
        ...prev,
        {
          id: podcastId,
          type: "processing",
          content: "podcast",
        },
      ])
    }

    try {
      const extractedText = sessionStorage.getItem("extractedText") || ""

      const results: { quiz?: any; podcast?: any } = {}

      // Generate quiz if selected
      if (selectedOptions.quiz) {
        const quizResponse = await fetch("/api/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: extractedText, count: 5 }),
        })

        if (quizResponse.ok) {
          const quizData = await quizResponse.json()
          results.quiz = quizData.quiz
          sessionStorage.setItem("quizData", JSON.stringify(quizData.quiz))
        }
      }

      // Generate podcast if selected
      if (selectedOptions.podcast) {
        const podcastResponse = await fetch("/api/generate-podcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: extractedText }),
        })

        if (podcastResponse.ok) {
          const podcastData = await podcastResponse.json()
          results.podcast = podcastData.podcast_script
          sessionStorage.setItem("podcastScript", podcastData.podcast_script)
        }
      }

      // Remove processing messages
      setMessages((prev) => prev.filter((msg) => !processingIds.includes(msg.id)))

      // Add completed cards
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "completed",
          results: {
            quiz: selectedOptions.quiz ? results.quiz : undefined,
            podcast: selectedOptions.podcast ? results.podcast : undefined,
          },
        },
      ])

      // Add final bot message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "bot",
          content: "All done! Click on any card below to view your content.",
        },
      ])
    } catch (error) {
      console.error("Generation error:", error)

      // Remove processing messages
      setMessages((prev) => prev.filter((msg) => !processingIds.includes(msg.id)))

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "bot",
          content: "Sorry, there was an error generating your content. Please try again.",
        },
      ])
    }
  }

  const handleSendMessage = async (message: string) => {
    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "user",
        content: message,
      },
    ])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) throw new Error("Chat failed")

      const result = await response.json()

      // Add bot response
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "bot",
          content: result.response,
        },
      ])
    } catch (error) {
      // Fallback response
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "bot",
          content:
            "I'm here to help you transform PDFs into quizzes and podcasts. Please upload a PDF file to get started!",
        },
      ])
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <Plasma color="#00E5FF" speed={0.6} direction="forward" scale={1.9} opacity={0.3} mouseInteractive={false} />
        </div>
      </div>

      <ChatSidebar currentChatId={currentChatId} onSelectChat={handleSelectChat} onNewChat={handleNewChat} />

      <div className="flex-1 flex flex-col">
        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-gray-800/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            <span className="text-xl font-bold tracking-wide">Maestro</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-400">AI-Powered</span>
          </div>
        </nav>

        {/* Chat Container */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => {
              if (message.type === "processing") {
                return <ProcessingCard key={message.id} type={message.content as "quiz" | "podcast" | undefined} />
              }

              if (message.type === "options") {
                return (
                  <div key={message.id} className="flex justify-center gap-4 my-6">
                    <Button
                      onClick={() => handleOptionSelect("quiz")}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 py-6 text-lg"
                    >
                      <Brain className="w-5 h-5 mr-2" />
                      Quiz
                    </Button>
                    <Button
                      onClick={() => handleOptionSelect("podcast")}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-6 text-lg"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Podcast
                    </Button>
                    <Button
                      onClick={() => handleOptionSelect("both")}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 px-6 py-6 text-lg"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Both
                    </Button>
                  </div>
                )
              }

              if (message.type === "completed") {
                return (
                  <CompletedCard
                    key={message.id}
                    hasQuiz={!!message.results?.quiz}
                    hasPodcast={!!message.results?.podcast}
                  />
                )
              }

              return (
                <ChatMessage
                  key={message.id}
                  type={message.type}
                  content={message.content}
                  fileName={message.fileName}
                  fileSize={message.fileSize}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="relative z-10 border-t border-gray-800/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <ChatInput onSendMessage={handleSendMessage} onFileUpload={handleFileUpload} disabled={isProcessing} />
          </div>
        </div>
      </div>
    </div>
  )
}
