"use client"

import { useState } from "react"
import { MessageSquare, Plus, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatSession {
  id: string
  title: string
  timestamp: string
  preview: string
}

interface ChatSidebarProps {
  currentChatId: string
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
}

export function ChatSidebar({ currentChatId, onSelectChat, onNewChat }: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const chatSessions: ChatSession[] = [
    {
      id: "current",
      title: "Current Chat",
      timestamp: "Just now",
      preview: "Welcome to Maestro! I'm your AI assistant...",
    },
    {
      id: "chat-1",
      title: "Machine Learning Basics",
      timestamp: "2 hours ago",
      preview: "Generated quiz and podcast about ML fundamentals",
    },
    {
      id: "chat-2",
      title: "React Hooks Guide",
      timestamp: "Yesterday",
      preview: "Created interactive quiz on React hooks",
    },
    {
      id: "chat-3",
      title: "Python Data Science",
      timestamp: "2 days ago",
      preview: "Generated podcast about pandas and numpy",
    },
    {
      id: "chat-4",
      title: "Web Security Best Practices",
      timestamp: "3 days ago",
      preview: "Quiz and podcast on OWASP top 10",
    },
  ]

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
          height: "auto", // allow expansion as content grows
          minHeight: "100vh", // still fill screen initially
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

          {/* Chat History */}
          <div className="p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Chats</h3>
            {chatSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  onSelectChat(session.id)
                  setIsOpen(false)
                }}
                className={`
                  w-full text-left p-3 rounded-lg transition-all
                  ${
                    currentChatId === session.id
                      ? "bg-cyan-600/20 border border-cyan-600/50"
                      : "bg-gray-900/50 border border-gray-800/50 hover:bg-gray-800/50"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 mt-1 text-cyan-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{session.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{session.preview}</p>
                    <span className="text-xs text-gray-500 mt-1 block">{session.timestamp}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800/50 mt-auto">
            <div className="text-xs text-gray-500 text-center">
              <p>Chat history saved to S3</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
