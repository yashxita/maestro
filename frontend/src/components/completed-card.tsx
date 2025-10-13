"use client"

import { Brain, Mic, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface CompletedCardProps {
  hasQuiz: boolean
  hasPodcast: boolean
}

export function CompletedCard({ hasQuiz, hasPodcast }: CompletedCardProps) {
  return (
    <div className="flex justify-center my-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {hasQuiz && (
          <Link href="/quiz">
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Brain className="w-8 h-8 text-purple-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Quiz Ready</h3>
                    <p className="text-sm text-gray-400">Interactive questions</p>
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <Button
                variant="outline"
                className="w-full bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30 text-purple-300 group-hover:text-purple-200"
              >
                Start Quiz
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Link>
        )}

        {hasPodcast && (
          <Link href="/podcast">
            <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-400/50 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Mic className="w-8 h-8 text-cyan-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Podcast Ready</h3>
                    <p className="text-sm text-gray-400">Audio conversation</p>
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <Button
                variant="outline"
                className="w-full bg-cyan-600/20 border-cyan-500/50 hover:bg-cyan-600/30 text-cyan-300 group-hover:text-cyan-200"
              >
                Listen Now
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
