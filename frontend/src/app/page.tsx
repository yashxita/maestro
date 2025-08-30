import { Zap, FileText, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
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
          <span className="text-xl font-bold">Halo AI</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 py-16 min-h-[80vh]">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Welcome{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Back</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl">
            Transform your PDFs into engaging podcasts or interactive quizzes with the power of AI. Upload your document
            and let our advanced AI create personalized learning experiences.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-4xl w-full">
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <FileText className="w-12 h-12 text-cyan-400 mb-4" />
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">PDF to Podcast</h3>
            <p className="text-gray-300">
              Convert your documents into engaging podcast conversations with AI-generated host and guest dialogue.
            </p>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <Brain className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-purple-400 mb-2">Interactive Quiz</h3>
            <p className="text-gray-300">
              Generate comprehensive quizzes from your content to test knowledge and enhance learning.
            </p>
          </div>
        </div>

        {/* Get Started Button */}
        <Link href="/upload">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 text-lg px-8 py-4">
            Get Started
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-8">
        <p className="text-gray-500 text-sm">Powered by advanced AI for seamless content transformation.</p>
      </footer>
    </div>
  )
}
