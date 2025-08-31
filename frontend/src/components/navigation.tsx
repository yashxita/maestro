"use client"

import { useState } from "react"
import { Zap, Menu, X } from "lucide-react"
import Link from "next/link"

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { href: "/services", label: "services" },
    { href: "/process", label: "process" },
    { href: "/team", label: "team" },
    { href: "/pricing", label: "pricing" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "contact" },
  ]

  return (
    <nav className="relative z-10 flex items-center justify-between p-6">
      <Link href="/" className="flex items-center space-x-2">
        <Zap className="w-6 h-6 text-cyan-400" />
        <span className="text-xl font-bold">Maestro</span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="text-gray-300 hover:text-cyan-400 transition-colors">
            {item.label}
          </Link>
        ))}
      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden text-gray-300 hover:text-cyan-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <button className="hidden md:block px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
        get this template
      </button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-gray-800 md:hidden">
          <div className="flex flex-col space-y-4 p-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-300 hover:text-cyan-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left">
              get this template
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
