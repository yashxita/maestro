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

interface QuizContainerProps {
  quiz: QuizQuestion[]
}

export function QuizContainer({ quiz }: QuizContainerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(quiz || [])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)

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

  if (!questions.length) {
    return <p className="text-gray-400">No quiz data available.</p>
  }

  if (quizCompleted) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Quiz Completed!</h2>
        <p>Your score: {score} / {questions.length}</p>
        <Button onClick={resetQuiz}>
          <RotateCcw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    )
  }

  return (
    <QuizCard
      question={questions[currentQuestionIndex]}
      onNext={handleNext}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={questions.length}
    />
  )
}
