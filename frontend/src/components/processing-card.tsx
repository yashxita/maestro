"use client"

import { Loader2, Brain, Mic } from "lucide-react"

interface ProcessingCardProps {
  type?: "quiz" | "podcast"
}

export function ProcessingCard({ type }: ProcessingCardProps) {
  return (
    <div className="flex justify-center my-4">
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <div className="flex-1">
            <p className="font-semibold text-white">
              {type === "quiz" ? "Generating Quiz..." : type === "podcast" ? "Generating Podcast..." : "Processing..."}
            </p>
            <p className="text-sm text-gray-400">
              {type === "quiz"
                ? "Creating AI-powered questions"
                : type === "podcast"
                  ? "Crafting audio conversation"
                  : "Extracting content from your PDF"}
            </p>
          </div>
          {type === "quiz" && <Brain className="w-6 h-6 text-purple-400" />}
          {type === "podcast" && <Mic className="w-6 h-6 text-cyan-400" />}
        </div>
      </div>
    </div>
  )
}
