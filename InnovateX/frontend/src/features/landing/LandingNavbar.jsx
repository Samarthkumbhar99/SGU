import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowRight, Menu, X, Sparkles, Globe, ChevronDown } from 'lucide-react'

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.webp"
              alt="SupplyShield AI Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-sm group-hover:scale-105 transition-all"
            />
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                Supply<span className="text-sky-600">Shield</span>
              </span>
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-sky-500 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <a href="#hero" className="hover:text-sky-600 transition-colors">
              Platform
            </a>
            <a href="#simulator" className="hover:text-sky-600 transition-colors flex items-center gap-1">
              Disruption Sandbox
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            </a>
            <a href="#architecture" className="hover:text-sky-600 transition-colors">
              Architecture
            </a>
            <a href="#roi" className="hover:text-sky-600 transition-colors">
              ROI Calculator
            </a>
            <Link to="/plans" className="hover:text-sky-600 transition-colors flex items-center gap-1 text-blue-600">
              Plans & Pricing
              <span className="text-[10px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.2 rounded-full">INR</span>
            </Link>
            <a href="#personas" className="hover:text-sky-600 transition-colors">
              Operations Team
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-bold text-slate-700 hover:text-sky-600 transition-colors px-3 py-2"
            >
              Sign In
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-sky-600/25 transition-all hover:scale-105"
            >
              <span>Launch Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-200 bg-white/95 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col gap-3 text-sm font-bold text-slate-800">
              <a
                href="#hero"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-sky-50 hover:text-sky-600"
              >
                Platform
              </a>
              <a
                href="#simulator"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-sky-50 hover:text-sky-600 flex items-center justify-between"
              >
                <span>Disruption Sandbox</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Live</span>
              </a>
              <a
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-sky-50 hover:text-sky-600"
              >
                Architecture
              </a>
              <a
                href="#roi"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-sky-50 hover:text-sky-600"
              >
                ROI Calculator
              </a>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 text-slate-700 font-bold text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/dashboard"
                  className="w-full text-center py-3 rounded-xl bg-sky-600 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Launch Demo
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
