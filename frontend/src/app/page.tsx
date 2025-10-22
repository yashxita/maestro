"use client"

import { useState } from "react"
import { ChatPage } from "@/components/chat-page"
import Home from "@/components/home"

export default function Page() {
  const [showHome, setShowHome] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleGetStarted = () => {
    const token = localStorage.getItem("authToken")
    setIsAuthenticated(!!token)
    setShowHome(false)
  }

  if (showHome) {
    // Always show Home first
    return <Home onGetStarted={handleGetStarted} />
  }

  // After clicking "Get Started", show ChatPage if authenticated, otherwise Home
  if (!isAuthenticated) {
    return <Home onGetStarted={handleGetStarted} />
  }

  return <ChatPage />
}
