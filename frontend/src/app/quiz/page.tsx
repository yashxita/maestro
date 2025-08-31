"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuizContainer } from "@/components/quiz-container";

export default function QuizPage() {
  const router = useRouter();
  const [extractedText, setExtractedText] = useState<string>("");
  const [quizData, setQuizData] = useState<any>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [error, setError] = useState<string>("");
  const [numQuestions, setNumQuestions] = useState<number | null>(null);
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    const storedText = sessionStorage.getItem("extractedText");
    if (!storedText) {
      router.push("/upload");
      return;
    }
    setExtractedText(storedText);
  }, [router]);

  const generateQuiz = async (text: string, count: number) => {
    setStartAnimation(true); // trigger folder animation first
    setTimeout(async () => {
      setIsGeneratingQuiz(true);
      setError("");
      try {
        const response = await fetch("/api/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, count }),
        });
        if (!response.ok) throw new Error("Failed to generate quiz");
        const result = await response.json();
        setQuizData(result.quiz);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Quiz generation failed"
        );
      } finally {
        setIsGeneratingQuiz(false);
      }
    }, 800); // let animation play first
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-300 hover:text-cyan-400"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-cyan-400" />
            <span className="text-xl font-bold">AI Quiz</span>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 py-8">
        <div className="w-full max-w-4xl space-y-8">
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-900/20 border-red-500/50"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Ask for question count */}
          {!quizData && !isGeneratingQuiz && (
            <div className="flex justify-center">
              <motion.div
                className="relative w-[46rem] h-90 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-xl p-12 flex flex-col items-center justify-center"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                {/* Folder Top Flap */}
                <div className="absolute -top-8 left-0 w-48 h-8 bg-slate-700 rounded-t-lg" />

                <h2 className="text-4xl font-bold mb-6">How many questions?</h2>
                <div className="flex space-x-6 text-white">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    placeholder="e.g. 5"
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-48 text-white text-xl p-4"
                  />
                  <Button
                    disabled={!numQuestions}
                    onClick={() => generateQuiz(extractedText, numQuestions!)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 text-xl rounded-xl"
                  >
                    Start Quiz
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Animation of cards coming out of folder */}

          {isGeneratingQuiz && (
            <div className="flex flex-col items-center justify-center h-[80vh]">
              {/* Big Title */}
              <h2 className="text-6xl font-bold text-cyan-400 mb-10 animate-pulse">
                Generating Your Quiz...
              </h2>

              {/* Fan-out looping cards centered */}
              <div className=" flex justify-center items-center w-full h-120 ml-12">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
  key={i}
  className="absolute w-60 h-90 bg-slate-700 rounded-xl shadow-2xl"
  initial={{ x: -10, opacity: 0, rotate: 5 * i }}
  animate={{
    x: [-10, i * 10 - 30, 60],  // nicely centered spread
    opacity: [0, 1, 0.7],
    rotate: [5 * i, 0, 5 * i],
  }}
  transition={{
    duration: 2.2,
    repeat: Infinity,
    repeatType: "loop",
    delay: i * 0.25,
  }}
/>
                ))}
              </div>
            </div>
          )}

          {quizData && !isGeneratingQuiz && (
            <motion.div
              className="rounded-2xl shadow-2xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-5xl font-bold mb-2">
                  Your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    AI
                  </span>{" "}
                  Quiz
                </h1>
                <p className="text-gray-300 text-lg">
                  Test your knowledge on the uploaded content
                </p>
              </div>
              <QuizContainer quiz={quizData} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
