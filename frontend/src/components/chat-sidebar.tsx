"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Plus, Menu, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchWithAuth } from "@/lib/auth"

interface ChatSession {
  id: number
  title: string
  created_at: string
  updated_at: string
}

interface UploadedFile {
  id: number
  filename: string
  created_at: string
}

interface ChatSidebarProps {
  currentChatId: string
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  refreshTrigger?: number
}

export function ChatSidebar({ currentChatId, onSelectChat, onNewChat, refreshTrigger }: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [chats, setChats] = useState<ChatSession[]>([])
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)

  const refreshChats = async () => {
    try {
      const chatsResponse = await fetchWithAuth("/api/chats")
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json()
        setChats(chatsData.chats || [])
      }
    } catch (error) {
      console.error("Error refreshing chats:", error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch chats
        await refreshChats()

        // Fetch files
        const filesResponse = await fetchWithAuth("/api/files")
        if (filesResponse.ok) {
          const filesData = await filesResponse.json()
          setFiles(filesData.files || [])
        }
      } catch (error) {
        console.error("Error fetching sidebar data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (currentChatId || refreshTrigger) {
      refreshChats()
    }
  }, [currentChatId, refreshTrigger])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 left-4 z-50 lg:hidden bg-gray-900/90 backdrop-blur-sm border border-gray-700 hover:bg-gray-800"
        size="icon"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 w-80 bg-gray-950/95 backdrop-blur-sm border-r border-gray-800/50 z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static
        `}
        style={{
          height: "auto",
          minHeight: "100vh",
        }}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800/50 sticky top-0 bg-gray-950/95 backdrop-blur-sm z-10">
            <Button
              onClick={onNewChat}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Chats</h3>

            {loading ? (
              <div className="text-center text-gray-500 py-4">Loading...</div>
            ) : chats.length === 0 ? (
              <div className="text-center text-gray-500 py-4 text-sm">No chats yet. Start a new conversation!</div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id.toString())
                    setIsOpen(false)
                  }}
                  className={`
                    w-full text-left p-3 rounded-lg transition-all
                    ${
                      currentChatId === chat.id.toString()
                        ? "bg-cyan-600/20 border border-cyan-600/50"
                        : "bg-gray-900/50 border border-gray-800/50 hover:bg-gray-800/50"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 mt-1 text-cyan-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{chat.title}</h4>
                      <span className="text-xs text-gray-500 mt-1 block">{formatTimestamp(chat.created_at)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}

            {files.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6">
                  Uploaded Files
                </h3>
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="w-full text-left p-3 rounded-lg bg-gray-900/50 border border-gray-800/50"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 mt-1 text-purple-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{file.filename}</h4>
                        <span className="text-xs text-gray-500 mt-1 block">{formatTimestamp(file.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800/50 mt-auto">
            <div className="text-xs text-gray-500 text-center">
              <p>Chat history saved to database</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
