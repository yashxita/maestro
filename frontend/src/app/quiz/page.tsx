"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {QuizContainer} from "@/components/quiz-container"

export default function QuizPage() {
  const router = useRouter()
  const [extractedText, setExtractedText] = useState<string>("")
  const [quizData, setQuizData] = useState<any>(null)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // Get data from sessionStorage
    const storedText = sessionStorage.getItem("extractedText")

    if (!storedText) {
      router.push("/upload")
      return
    }

    setExtractedText(storedText)
    generateQuiz(storedText)
  }, [router])

  const generateQuiz = async (text: string) => {
    setIsGeneratingQuiz(true)
    setError("")

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

      const result = await response.json()
      setQuizData(result.quiz)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Quiz generation failed")
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-300 hover:text-cyan-400">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-cyan-400" />
            <span className="text-xl font-bold">AI Quiz</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 py-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quiz Generation Loading */}
          {isGeneratingQuiz && (
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl text-center">
              <Brain className="w-8 h-8 mx-auto mb-4 animate-pulse text-cyan-400" />
              <h2 className="text-xl font-semibold text-cyan-400 mb-2">Generating Your Quiz</h2>
              <p className="text-gray-300">Creating intelligent questions from your content...</p>
            </div>
          )}

          {/* Quiz Container */}
          {quizData && !isGeneratingQuiz && (
            <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  Your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span>{" "}
                  Quiz
                </h1>
                <p className="text-gray-300">Test your knowledge on the uploaded content</p>
              </div>

              <QuizContainer quiz={quizData} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
