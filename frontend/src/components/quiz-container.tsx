"use client"

import { useState } from "react"
import { QuizCard } from "./quiz-card"
import { Button } from "@/components/ui/button"
import { Trophy, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())

  const handleCorrectAnswer = (questionIndex: number) => {
    if (!answeredQuestions.has(questionIndex)) {
      setScore((prev) => prev + 1)
      setAnsweredQuestions((prev) => new Set([...prev, questionIndex]))
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
    setAnsweredQuestions(new Set())
  }

  if (!questions.length) {
    return <p className="text-gray-400">No quiz data available.</p>
  }

  if (quizCompleted) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center mb-4">
          <Trophy className="w-16 h-16 text-yellow-500" />
        </div>
        <h2 className="text-3xl font-bold text-white">Quiz Completed!</h2>
        <div className="text-2xl">
          <span className="text-cyan-400">Your score: </span>
          <span className="text-white font-bold">{score}</span>
          <span className="text-gray-400"> / {questions.length}</span>
        </div>
        <div className="text-lg text-gray-300">
          {score === questions.length
            ? "Perfect score! 🎉"
            : score >= questions.length * 0.8
              ? "Great job! 👏"
              : score >= questions.length * 0.6
                ? "Good effort! 👍"
                : "Keep practicing! 💪"}
        </div>
        <Button onClick={resetQuiz} className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3">
          <RotateCcw className="w-4 h-4 mr-2" /> Retry Quiz
        </Button>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{
              x: 300,
              opacity: 0,
              rotateY: -15,
              scale: 0.9,
            }}
            animate={{
              x: 0,
              opacity: 1,
              rotateY: 0,
              scale: 1,
            }}
            exit={{
              x: -300,
              opacity: 0,
              rotateY: 15,
              scale: 0.9,
              zIndex: -1,
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
            }}
            className="relative z-10"
          >
            <QuizCard
              question={questions[currentQuestionIndex]}
              onNext={handleNext}
              onCorrectAnswer={() => handleCorrectAnswer(currentQuestionIndex)}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />
          </motion.div>
        </AnimatePresence>

        {currentQuestionIndex < questions.length - 1 && (
          <>
            <div
              className="absolute top-2 left-2 w-full h-full bg-slate-800/30 rounded-lg -z-10 transform rotate-1"
              style={{ zIndex: -1 }}
            />
            <div
              className="absolute top-4 left-4 w-full h-full bg-slate-800/20 rounded-lg -z-20 transform rotate-2"
              style={{ zIndex: -2 }}
            />
          </>
        )}
      </div>
    </div>
  )
}
