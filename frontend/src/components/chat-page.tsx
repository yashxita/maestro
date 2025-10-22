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
import { fetchWithAuth } from "@/lib/auth"

interface Message {
  id: string
  type: "bot" | "user" | "file" | "processing" | "options" | "completed"
  content?: string
  fileName?: string
  fileSize?: number
  options?: { quiz: boolean; podcast: boolean }
  selectedOptions?: { quiz: boolean; podcast: boolean }
  results?: { quiz?: any; podcast?: any }
}

export function ChatPage() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
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
        "You can upload a PDF document, and I'll help you create:\n\n📝 Interactive Quiz - Test your knowledge with AI-generated questions\n🎙️ AI Podcast - Listen to an engaging conversation about your content\n\nJust upload a PDF to get started!",
    },
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSelectChat = async (chatId: string) => {
    setCurrentChatId(chatId)
    console.log("[v0] Selected chat:", chatId)

    try {
      const response = await fetchWithAuth(`/api/chats/${chatId}`)
      if (response.ok) {
        const data = await response.json()

        const loadedMessages: Message[] = data.messages.map((msg: any) => {
          const baseMessage: Message = {
            id: msg.id.toString(),
            type: msg.role === "user" ? "user" : "bot",
            content: msg.content,
          }

          // Add file info if present
          if (msg.file_name) {
            baseMessage.fileName = msg.file_name
            baseMessage.fileSize = msg.file_size
            baseMessage.type = "file"
          }

          return baseMessage
        })

        if (loadedMessages.length === 0) {
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
                "You can upload a PDF document, and I'll help you create:\n\n📝 Interactive Quiz - Test your knowledge with AI-generated questions\n🎙️ AI Podcast - Listen to an engaging conversation about your content\n\nJust upload a PDF to get started!",
            },
          ])
        } else {
          setMessages(loadedMessages)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading chat:", error)
    }
  }

  const handleNewChat = async () => {
    try {
      const response = await fetchWithAuth("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentChatId(data.chat.id.toString())
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
              "You can upload a PDF document, and I'll help you create:\n\n📝 Interactive Quiz - Test your knowledge with AI-generated questions\n🎙️ AI Podcast - Listen to an engaging conversation about your content\n\nJust upload a PDF to get started!",
          },
        ])
        setUploadedFileId(null)
        sessionStorage.removeItem("extractedText")
        sessionStorage.removeItem("podcastScript")
        sessionStorage.removeItem("quizData")
      }
    } catch (error) {
      console.error("[v0] Error creating new chat:", error)
    }
  }

  const saveMessage = async (role: "user" | "assistant", content: string, fileName?: string) => {
    if (!currentChatId) return

    try {
      await fetchWithAuth(`/api/chats/${currentChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          content,
          file_name: fileName,
        }),
      })

      setSidebarRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("[v0] Error saving message:", error)
    }
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

    if (!currentChatId) {
      await handleNewChat()
    }

    // Add user file message
    const fileMsgId = `file-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: fileMsgId,
        type: "file",
        fileName: file.name,
        fileSize: file.size,
      },
    ])

    await saveMessage("user", `Uploaded file: ${file.name}`, file.name)

    // Add bot processing message
    const botMsgId = `bot-${Date.now()}`
    const processingMsg = "Great! I've received your PDF. Processing the content..."
    setMessages((prev) => [
      ...prev,
      {
        id: botMsgId,
        type: "bot",
        content: processingMsg,
      },
    ])

    await saveMessage("assistant", processingMsg)

    // Add processing card
    const processingId = `processing-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: processingId,
        type: "processing",
      },
    ])

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetchWithAuth("/api/upload", { method: "POST", body: formData })
      if (!response.ok) throw new Error("Upload failed")

      const result = await response.json()
      setUploadedFileId(result.file_id)
      sessionStorage.setItem("fileId", result.file_id.toString())
      sessionStorage.setItem("extractedText", result.full_text)
      sessionStorage.setItem("podcastScript", result.podcast_script || "")

      // Remove processing message
      setMessages((prev) => prev.filter((msg) => msg.id !== processingId))

      // Add success bot message
      const successMsg = "Perfect! Your document has been processed. What would you like to create?"
      const successMsgId = `bot-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        {
          id: successMsgId,
          type: "bot",
          content: successMsg,
        },
      ])

      await saveMessage("assistant", successMsg)

      // Add options
      const optionsId = `options-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        {
          id: optionsId,
          type: "options",
          options: { quiz: false, podcast: false },
        },
      ])
    } catch (error) {
      const errorMsg = "Sorry, there was an error processing your file. Please try again."
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          type: "bot",
          content: errorMsg,
        },
      ])
      await saveMessage("assistant", errorMsg)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOptionSelect = async (option: "quiz" | "podcast" | "both") => {
    setMessages((prev) => prev.filter((msg) => msg.type !== "options"))

    const selectedOptions = {
      quiz: option === "quiz" || option === "both",
      podcast: option === "podcast" || option === "both",
    }

    const optionText = option === "both" ? "both Quiz and Podcast" : option === "quiz" ? "Quiz" : "Podcast"
    const userMsg = `I'd like to create ${optionText}`

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: "user",
        content: userMsg,
      },
    ])

    await saveMessage("user", userMsg)

    const botMsg = `Excellent choice! I'm generating your ${optionText} now...`
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        type: "bot",
        content: botMsg,
      },
    ])

    await saveMessage("assistant", botMsg)

    const processingIds: string[] = []
    if (selectedOptions.quiz) {
      const quizId = `quiz-${Date.now()}`
      processingIds.push(quizId)
      setMessages((prev) => [...prev, { id: quizId, type: "processing", content: "quiz" }])
    }
    if (selectedOptions.podcast) {
      const podcastId = `podcast-${Date.now()}`
      processingIds.push(podcastId)
      setMessages((prev) => [...prev, { id: podcastId, type: "processing", content: "podcast" }])
    }

    try {
      const results: { quiz?: any; podcast?: any } = {}

      if (selectedOptions.quiz) {
        const extractedText = sessionStorage.getItem("extractedText") || ""
        const quizResponse = await fetchWithAuth("/api/generate-quiz", {
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

      if (selectedOptions.podcast) {
        const podcastScript = sessionStorage.getItem("podcastScript") || ""
        results.podcast = {
          script: podcastScript,
          audio_url: null,
        }
      }

      // Remove processing messages
      setMessages((prev) => prev.filter((msg) => !processingIds.includes(msg.id)))

      setMessages((prev) => [
        ...prev,
        {
          id: `completed-${Date.now()}`,
          type: "completed",
          selectedOptions: selectedOptions,
          results: {
            quiz: results.quiz,
            podcast: results.podcast,
          },
        },
      ])

      const doneMsg = "All done! Click on any card below to view your content."
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          type: "bot",
          content: doneMsg,
        },
      ])

      await saveMessage("assistant", doneMsg)
    } catch (error) {
      console.error("Generation error:", error)
      setMessages((prev) => prev.filter((msg) => !processingIds.includes(msg.id)))
      const errorMsg = "Sorry, there was an error generating your content. Please try again."
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          type: "bot",
          content: errorMsg,
        },
      ])
      await saveMessage("assistant", errorMsg)
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!currentChatId) {
      await handleNewChat()
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: "user",
        content: message,
      },
    ])

    await saveMessage("user", message)

    try {
      const extractedText = sessionStorage.getItem("extractedText") || null

      const response = await fetchWithAuth("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context: extractedText,
        }),
      })

      if (!response.ok) throw new Error("Chat failed")

      const result = await response.json()
      const botResponse = result.response

      setMessages((prev) => [...prev, { id: `bot-${Date.now()}`, type: "bot", content: botResponse }])

      await saveMessage("assistant", botResponse)
    } catch (error) {
      console.error("[v0] Chat error:", error)
      const fallbackMsg =
        "I'm here to help you transform PDFs into quizzes and podcasts. Please upload a PDF file to get started!"
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          type: "bot",
          content: fallbackMsg,
        },
      ])
      await saveMessage("assistant", fallbackMsg)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex">
      <div className="absolute inset-0 z-0">
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <Plasma color="#00E5FF" speed={0.6} direction="forward" scale={1.9} opacity={0.3} mouseInteractive={false} />
        </div>
      </div>

      <ChatSidebar
        currentChatId={currentChatId || ""}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        refreshTrigger={sidebarRefreshTrigger}
      />

      <div className="flex-1 flex flex-col">
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
                    hasQuiz={message.selectedOptions?.quiz || false}
                    hasPodcast={message.selectedOptions?.podcast || false}
                    quizData={message.results?.quiz}
                    podcastData={message.results?.podcast}
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

        <div className="relative z-10 border-t border-gray-800/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <ChatInput onSendMessage={handleSendMessage} onFileUpload={handleFileUpload} disabled={isProcessing} />
          </div>
        </div>
      </div>
    </div>
  )
}
