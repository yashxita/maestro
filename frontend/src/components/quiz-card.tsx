"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizCardProps {
  question: QuizQuestion;
  onNext: () => void;
  onCorrectAnswer: () => void;
  questionNumber: number;
  totalQuestions: number;
}

export function QuizCard({
  question,
  onNext,
  onCorrectAnswer,
  questionNumber,
  totalQuestions,
}: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctAnswer: number;
    explanation: string;
  } | null>(null);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;

    setSelectedAnswer(answerIndex);

    // Validate answer locally using question data
    const isCorrect = answerIndex === question.correctAnswer;
    setResult({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
    setShowResult(true);

    if (isCorrect) {
      onCorrectAnswer();
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setResult(null);
    onNext();
  };

  return (
    <Card className="relative w-full max-w-xl mx-auto p-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 border-blue-500/30 shadow-2xl shadow-blue-500/10">
      {/* Neon blue glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 rounded-lg blur-xl -z-10" />

      {/* Question header */}
      <div className="mb-4 mt-2">
        <div className="flex items-center justify-between mb-4">
          <span className="text-blue-400 text-sm font-medium">
            Question {questionNumber} of {totalQuestions}
          </span>
          <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 ml-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-6 text-balance">
          {question.question}
        </h2>
      </div>

      {/* Answer options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => {
          let buttonClass =
            "text-base sm:text-lg md:text-md w-full p-4 text-left border-2 transition-all duration-200 hover:scale-[1.02] bg-slate-800/50 border-slate-700 text-white hover:border-blue-500/50 hover:bg-slate-800/80 flex";

          if (showResult && result) {
            if (index === result.correctAnswer) {
              // Correct answer - always green
              buttonClass =
                "w-full p-4 text-left border-2 bg-green-500/20 border-green-500 text-green-100";
            } else if (index === selectedAnswer && !result.isCorrect) {
              // Wrong selected answer - red
              buttonClass =
                "w-full p-4 text-left border-2 bg-red-500/20 border-red-500 text-red-100";
            } else {
              // Other options when result is shown
              buttonClass =
                "w-full p-4 text-left border-2 bg-slate-800/30 border-slate-600 text-slate-400";
            }
          } else if (selectedAnswer === index) {
            // Selected but no result yet
            buttonClass =
              "w-full p-4 text-left border-2 bg-blue-500/20 border-blue-500 text-blue-100";
          }

          return (
            <Button
  key={index}
  className={cn(
    buttonClass,
    "flex items-center justify-between w-full text-left whitespace-normal break-words leading-snug min-h-[60px] px-5 py-4"
  )}
  onClick={() => handleAnswerSelect(index)}
  disabled={showResult}
>
  {/* Option text */}
  <span className="flex-1 text-sm sm:text-base break-words text-left leading-relaxed pr-4">
    {option}
  </span>

  {/* Icon */}
  {showResult && result && (
    <div className="flex-shrink-0 flex items-center">
      {index === result.correctAnswer && (
        <Check className="w-5 h-5 text-green-500" />
      )}
      {index === selectedAnswer &&
        !result.isCorrect &&
        index !== result.correctAnswer && (
          <X className="w-5 h-5 text-red-500" />
        )}
    </div>
  )}
</Button>

          );
        })}
      </div>

      {/* Explanation */}
      {showResult && result && (
        <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center mb-2">
            {result.isCorrect ? (
              <Check className="w-5 h-5 text-green-500 mr-2" />
            ) : (
              <X className="w-5 h-5 text-red-500 mr-2" />
            )}
            <span
              className={cn(
                "font-medium",
                result.isCorrect ? "text-green-400" : "text-red-400"
              )}
            >
              {result.isCorrect ? "Correct!" : "Incorrect"}
            </span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            {result.explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      {showResult && (
        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            {questionNumber === totalQuestions
              ? "Finish Quiz"
              : "Next Question"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </Card>
  );
}
