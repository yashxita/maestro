"use client"

import { useState, useEffect } from "react"
import { QuizCard } from "./quiz-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, RotateCcw } from "lucide-react"

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export function QuizContainer() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/quiz")
      const data = await response.json()

      if (data.success) {
        setQuestions(data.questions)
      } else {
        setError("Failed to load quiz questions")
      }
    } catch (err) {
      setError("Error loading quiz")
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setQuizCompleted(false)
    setScore(0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="p-8 bg-slate-800/50 border-blue-500/30">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Loading quiz questions...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="p-8 bg-slate-800/50 border-red-500/30">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={fetchQuestions} variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto p-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 border-blue-500/30 shadow-2xl shadow-blue-500/10 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 rounded-lg blur-xl -z-10" />

          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Quiz Completed!</h2>
          <p className="text-slate-300 mb-6">You've finished all {questions.length} questions. Great job!</p>

          <Button
            onClick={resetQuiz}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Take Quiz Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {questions.length > 0 && (
        <QuizCard
          question={questions[currentQuestionIndex]}
          onNext={handleNext}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
        />
      )}
    </div>
  )
}
