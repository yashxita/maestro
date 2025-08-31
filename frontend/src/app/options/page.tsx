"use client"

import { Zap, Mic, Brain, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function OptionsPage() {
  const [hasContent, setHasContent] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we have extracted content
    const extractedText = sessionStorage.getItem("extractedText")
    if (!extractedText) {
      router.push("/upload")
      return
    }
    setHasContent(true)
  }, [router])

  if (!hasContent) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <Zap className="w-6 h-6 text-cyan-400" />
          <span className="text-xl font-bold">Maestro</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 py-16 min-h-[80vh]">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Choose Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Experience</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">What would you like to create from your document?</p>
        </div>

        {/* Option Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
          {/* Podcast Option */}
          <Link href="/podcast">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group">
              <div className="text-center">
                <Mic className="w-16 h-16 text-cyan-400 mx-auto mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-semibold text-cyan-400 mb-4">Generate Podcast</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Transform your document into an engaging podcast conversation between a host and guest. Perfect for
                  learning on the go.
                </p>
                <div className="flex items-center justify-center text-cyan-400 group-hover:text-cyan-300">
                  <span className="mr-2">Create Podcast</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Quiz Option */}
          <Link href="/quiz">
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl hover:border-purple-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group">
              <div className="text-center">
                <Brain className="w-16 h-16 text-purple-400 mx-auto mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-semibold text-purple-400 mb-4">Take Quiz</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Test your knowledge with AI-generated questions based on your document content. Interactive learning
                  made easy.
                </p>
                <div className="flex items-center justify-center text-purple-400 group-hover:text-purple-300">
                  <span className="mr-2">Start Quiz</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
