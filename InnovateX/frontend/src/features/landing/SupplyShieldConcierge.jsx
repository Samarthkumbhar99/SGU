import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  ArrowUp,
  Calendar,
  Send,
  Sparkles,
  Bot,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react'
import axios from 'axios'

export default function SupplyShieldConcierge() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speakerEnabled, setSpeakerEnabled] = useState(true)
  const [showVoiceBanner, setShowVoiceBanner] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  // Chat message thread
  const [messages, setMessages] = useState([
    { id: 1, sender: 'assistant', text: 'Hi there!' },
    { id: 2, sender: 'assistant', text: "I'm your SupplyShield Sales Concierge." },
    {
      id: 3,
      sender: 'assistant',
      text: 'I help teams explore how SupplyShield supports planning and operations.',
      suggestedOptions: [
        'How does Dynamic FEFO reduce food waste?',
        'Tell me about Google OR-Tools MILP solver',
        'How fast does the engine re-plan during highway closures?',
      ],
    },
  ])

  const chatBottomRef = useRef(null)
  const recognitionRef = useRef(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Initialize Speech Recognition (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join('')
        setInputText(transcript)
      }

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  // Text-to-Speech function for AI spoken responses
  const speakResponse = (text) => {
    if (!speakerEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    // Clean markdown symbols for natural voice narration
    const cleanText = text.replace(/[*_#`\[\]]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.05
    utterance.pitch = 1.0

    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Jenny') ||
          v.name.includes('Zira') ||
          v.name.includes('Female'))
    )
    if (preferredVoice) utterance.voice = preferredVoice

    window.speechSynthesis.speak(utterance)
  }

  // Toggle Microphone Speech-to-Text
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        if (!isOpen) setIsOpen(true)
      } catch (err) {
        console.warn('Recognition start failed:', err)
      }
    }
  }

  // Toggle Speaker Text-to-Speech
  const toggleSpeaker = () => {
    if (speakerEnabled) {
      window.speechSynthesis?.cancel()
      setSpeakerEnabled(false)
    } else {
      setSpeakerEnabled(true)
    }
  }

  // Send a message to Groq Concierge API
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim()
    if (!text || isLoading) return

    // Stop listening if speech recognition was active
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }

    // Add user message to thread
    const userMsg = { id: Date.now(), sender: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsLoading(true)
    if (!isOpen) setIsOpen(true)

    try {
      const res = await axios.post('/api/v1/chat/concierge', {
        message: text,
        conversationHistory: messages.slice(-5),
      })

      const reply =
        res.data?.reply ||
        'SupplyShield AI coordinates distribution planning using deterministic Google OR-Tools MILP and Dynamic FEFO perishable routing.'
      const suggestedOptions = res.data?.suggestedOptions || [
        'How does Dynamic FEFO reduce food waste?',
        'Tell me about Google OR-Tools MILP solver',
        'Show 3D Regional Network Map',
      ]

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: reply,
        suggestedOptions,
      }

      setMessages((prev) => [...prev, aiMsg])

      // Speak AI response with Text-to-Speech
      speakResponse(reply)
    } catch (err) {
      console.error('Concierge chat error:', err)
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: 'Dynamic FEFO synchronizes batch expiration dates with store velocities, routing expiring perishables to high-velocity stores like Colaba Store S-04 to eliminate food waste.',
        suggestedOptions: [
          'How does Google OR-Tools work?',
          'What distribution centers are supported?',
        ],
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* ======================================================== */}
      {/* 1. COLLAPSED FLOATING BAR (EXACT MATCH TO IMAGE 1)      */}
      {/* ======================================================== */}
      {!isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-2.5 select-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Top Pill: Blue Concierge Button + Book Calendar Icon */}
          <div className="bg-[#111827] text-white rounded-full p-1.5 flex items-center gap-2 shadow-2xl border border-slate-800/90 hover:border-slate-700 transition-all">
            {/* Left Inner Blue Pill */}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="bg-[#0284c7] hover:bg-[#0369a1] text-white pl-1.5 pr-4 py-1.5 rounded-full flex items-center gap-2.5 transition-all shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              {/* Concierge Avatar with green online dot */}
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
                  alt="SupplyShield Concierge"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white/90 shadow-xs"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-1.5 ring-slate-900 animate-pulse" />
              </div>
              <span className="text-xs sm:text-sm font-bold tracking-tight">Resume Conversation</span>
            </button>

            {/* Right Book Icon */}
            <button
              type="button"
              onClick={() => navigate('/network-map')}
              className="px-2.5 py-1 flex flex-col items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer group"
              title="Book a Demo"
            >
              <Calendar className="w-4 h-4 text-slate-200 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold tracking-tight mt-0.5">Book</span>
            </button>
          </div>

          {/* Bottom Pill: Ask a question... Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="bg-[#111827]/95 backdrop-blur-md rounded-full pl-4 pr-1.5 py-1.5 flex items-center justify-between shadow-2xl border border-slate-800/90 w-72 sm:w-80 group focus-within:border-sky-500 transition-all"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question..."
              className="bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 font-medium focus:outline-none w-full mr-2"
            />

            <div className="flex items-center gap-1 shrink-0">
              {/* Mic Icon */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Speak question"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>

              {/* Up-Arrow Submit Button */}
              <button
                type="submit"
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-[#0284c7] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
                title="Send"
              >
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. EXPANDED CHATBOT POPUP (EXACT MATCH TO IMAGE 2)      */}
      {/* ======================================================== */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] max-h-[85vh] h-[670px] bg-[#090d16] text-white rounded-[32px] shadow-2xl border-2 border-slate-800 flex flex-col overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
          {/* Top Banner Card: Ask me about... (Exact match to Image 2) */}
          <div className="relative bg-[#dff2fd] text-slate-900 rounded-2xl p-4 sm:p-5 m-3.5 mb-2.5 overflow-hidden shadow-xs">
            {/* Floating Voice Ready Pill */}
            {showVoiceBanner && (
              <div className="absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-slate-200/80 text-[11px] font-bold text-slate-800 animate-in fade-in duration-200">
                <span className="flex items-center gap-0.5 text-sky-600">
                  <span className="w-0.5 h-2.5 bg-sky-600 animate-pulse" />
                  <span className="w-0.5 h-4 bg-sky-600 animate-pulse delay-75" />
                  <span className="w-0.5 h-2 bg-sky-600 animate-pulse delay-150" />
                </span>
                <span>Voice is ready, enable mic to talk</span>
                <button
                  type="button"
                  onClick={() => setShowVoiceBanner(false)}
                  className="text-slate-400 hover:text-slate-700 ml-1 p-0.5"
                  title="Dismiss"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="pr-4">
              <h3 className="text-sm font-extrabold text-slate-900 mb-2.5">
                Ask me about...
              </h3>
              <ul className="space-y-1.5 text-[11px] font-semibold text-slate-700 leading-tight">
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1 shrink-0" />
                  <span>Unifying your supply chain planning with an AI-native platform</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1 shrink-0" />
                  <span>How SupplyShield AI agents improve forecast accuracy and reduce waste</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1 shrink-0" />
                  <span>How teams get started and see measurable results with SupplyShield</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1 shrink-0" />
                  <span>How SupplyShield drives smarter decisions and higher product availability</span>
                </li>
              </ul>
            </div>

            {/* Subtle robot/metrics watermark */}
            <div className="absolute -right-2 -bottom-2 w-28 h-28 opacity-25 pointer-events-none flex items-center justify-center">
              <Bot className="w-24 h-24 text-sky-800" />
            </div>
          </div>

          {/* Action Button: Book a Meeting (Exact match to Image 2) */}
          <div className="px-3.5 mb-2.5">
            <button
              type="button"
              onClick={() => navigate('/network-map')}
              className="w-full py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs tracking-wide shadow-md transition-all hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Book a Meeting / Launch Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Voice Controls Bar: Mic & Speaker Toggles (Exact match to Image 2) */}
          <div className="flex items-center justify-center gap-8 py-2 px-4 border-b border-slate-800/80 bg-[#0c121e]">
            {/* Mic Toggle */}
            <button
              type="button"
              onClick={toggleListening}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white ring-4 ring-rose-500/30 animate-pulse'
                    : 'bg-slate-800 text-slate-300 group-hover:text-white group-hover:bg-slate-700'
                }`}
              >
                {isListening ? (
                  <Mic className="w-4 h-4 text-white" />
                ) : (
                  <div className="relative">
                    <Mic className="w-4 h-4 text-rose-500" />
                    <span className="absolute inset-0 border-t-2 border-rose-500 rotate-45 transform origin-center" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">
                {isListening ? 'Listening...' : 'Mic'}
              </span>
            </button>

            {/* Speaker Toggle */}
            <button
              type="button"
              onClick={toggleSpeaker}
              className="flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  speakerEnabled
                    ? 'bg-sky-600/30 text-sky-400 border border-sky-500/40'
                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                }`}
              >
                {speakerEnabled ? (
                  <Volume2 className="w-4 h-4 text-sky-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200">
                {speakerEnabled ? 'Speaker On' : 'Speaker Off'}
              </span>
            </button>
          </div>

          {/* Chat Messages Scroll Container */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user'

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  {/* Bubble */}
                  <div
                    className={`px-4 py-2.5 text-xs leading-relaxed max-w-[85%] ${
                      isUser
                        ? 'bg-[#0284c7] text-white rounded-2xl rounded-br-xs shadow-md'
                        : 'bg-[#182234] text-slate-200 rounded-2xl rounded-bl-xs border border-slate-800/90 shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Clickable Suggested Option Chips */}
                  {msg.suggestedOptions && msg.suggestedOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 max-w-[95%]">
                      {msg.suggestedOptions.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSendMessage(opt)}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-sky-900/60 text-sky-300 hover:text-white border border-sky-500/30 transition-all cursor-pointer hover:scale-102 text-left"
                        >
                          {opt} →
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#182234] border border-slate-800/90 w-fit text-slate-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce delay-200" />
                <span className="text-[10px] text-slate-400 ml-1">Groq is thinking...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Bottom Input Form (Exact match to Image 2) */}
          <div className="p-3 bg-[#0c121e] border-t border-slate-800/80 relative">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="bg-[#111827] rounded-full pl-4 pr-1.5 py-1.5 flex items-center justify-between border border-slate-800 focus-within:border-sky-500 transition-all"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? 'Listening to your voice...' : 'Type here...'}
                className="bg-transparent text-xs text-white placeholder:text-slate-500 font-medium focus:outline-none w-full mr-2"
              />

              <div className="flex items-center gap-1 shrink-0">
                {/* Mic speech-to-text button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Speak message"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-[#0284c7] disabled:opacity-50 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  title="Send message"
                >
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </div>

          {/* Floating Bottom Close Button (Exact match to Image 2) */}
          <button
            type="button"
            onClick={() => {
              window.speechSynthesis?.cancel()
              setIsOpen(false)
            }}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-600 shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95"
            title="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}
