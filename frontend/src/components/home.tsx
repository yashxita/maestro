import { Zap, FileText, Brain, PlayCircle, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Dither from "@/components/Dither";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <Dither
            waveColor={[0.1, 0.32, 0.6]}
            disableAnimation={false}
            enableMouseInteraction={true}
            mouseRadius={0.3}
            colorNum={4}
            waveAmplitude={0.1}
            waveFrequency={3}
            waveSpeed={0.05}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <Zap className="w-6 h-6 text-cyan-400" />
          <span className="text-xl font-bold">Maestro</span>
        </div>
        <div className="space-x-6 hidden md:flex">
          <Link href="#features" className="text-gray-300 hover:text-white">Features</Link>
          <Link href="#how" className="text-gray-300 hover:text-white">How It Works</Link>
          
          <Link href="#testimonials" className="text-gray-300 hover:text-white">Testimonials</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 flex flex-col items-center justify-center px-8 py-16 min-h-[80vh] text-center">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 max-w-5xl">
          Transform Your PDFs into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Interactive Experiences
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-6xl">
          Upload any document and let Maestro turn it into a podcast, interactive quiz, or AI-powered study guide.
        </p>
        <Link href="/upload">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 text-lg px-8 py-4">
            Get Started
          </Button>
        </Link>
      </header>

      {/* Features */}
      <section id="features" className="relative z-10 px-8 py-20 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <FileText className="w-12 h-12 text-cyan-400 mb-4" />
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">PDF to Podcast</h3>
            <p className="text-gray-300">
              Convert your documents into engaging podcast conversations with AI-generated host and guest dialogue.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <Brain className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-purple-400 mb-2">Interactive Quiz</h3>
            <p className="text-gray-300">
              Generate comprehensive quizzes from your content to test knowledge and enhance learning.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="relative z-10 px-8 py-20 bg-white/5">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { icon: <FileText className="w-10 h-10 text-cyan-400" />, step: "Upload", text: "Upload your PDF or document to Maestro." },
            { icon: <Brain className="w-10 h-10 text-purple-400" />, step: "AI Processing", text: "Our AI processes and transforms your content." },
            { icon: <PlayCircle className="w-10 h-10 text-blue-400" />, step: "Engage", text: "Listen to podcasts or take interactive quizzes." },
          ].map((s, i) => (
            <div key={i} className="bg-white/10 border border-gray-700 rounded-2xl p-6 text-center shadow-lg">
              <div className="flex justify-center mb-4">{s.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{s.step}</h3>
              <p className="text-gray-300">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 px-8 py-20 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12">What Users Say</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/10 border border-gray-700 rounded-2xl p-6 shadow-lg">
            <Users className="w-8 h-8 text-cyan-400 mb-4" />
            <p className="text-gray-300 mb-4">
              &quot;Maestro turned my boring lecture notes into a podcast I actually enjoyed listening to!&quot;
            </p>
            <span className="text-cyan-400 font-semibold">– Student</span>
          </div>
          <div className="bg-white/10 border border-gray-700 rounded-2xl p-6 shadow-lg">
            <Users className="w-8 h-8 text-purple-400 mb-4" />
            <p className="text-gray-300 mb-4">
              &quot;The quizzes helped me prepare for exams faster than ever.&quot;
            </p>
            <span className="text-purple-400 font-semibold">– Educator</span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      

      {/* Footer */}
      <footer className="relative z-10 text-center py-12">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} Maestro. Built with ❤️ and AI.
        </p>
      </footer>
    </div>
  );
}
