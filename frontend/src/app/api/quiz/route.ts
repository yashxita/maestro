import { type NextRequest, NextResponse } from "next/server"

// Sample quiz data - in a real app, this would come from a database or AI service
const sampleQuizData = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    explanation: "Paris is the capital and largest city of France, known for its art, fashion, and culture.",
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    explanation:
      "Mars is called the Red Planet due to iron oxide (rust) on its surface, giving it a reddish appearance.",
  },
  {
    id: 3,
    question: "What is the largest mammal in the world?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    correctAnswer: 1,
    explanation:
      "The Blue Whale is the largest animal ever known to have lived on Earth, reaching lengths of up to 100 feet.",
  },
  {
    id: 4,
    question: "In which year did World War II end?",
    options: ["1944", "1945", "1946", "1947"],
    correctAnswer: 1,
    explanation:
      "World War II ended in 1945 with the surrender of Japan in September, following the atomic bombings and Soviet invasion.",
  },
  {
    id: 5,
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: 2,
    explanation: "Au comes from the Latin word 'aurum' meaning gold. It's element 79 on the periodic table.",
  },
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      questions: sampleQuizData,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch quiz questions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { questionId, selectedAnswer } = await request.json()

    const question = sampleQuizData.find((q) => q.id === questionId)
    if (!question) {
      return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 })
    }

    const isCorrect = selectedAnswer === question.correctAnswer

    return NextResponse.json({
      success: true,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to process answer" }, { status: 500 })
  }
}
