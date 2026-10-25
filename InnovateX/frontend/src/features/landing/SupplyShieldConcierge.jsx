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
  const [voiceGender, setVoiceGender] = useState('female') // 'female' | 'male'
  const [voices, setVoices] = useState([])
  const [showVoiceBanner, setShowVoiceBanner] = useState(true)
  const [showTopBanner, setShowTopBanner] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  // Load available speech synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        const vList = window.speechSynthesis.getVoices()
        if (vList && vList.length > 0) {
          setVoices(vList)
        }
      }
      updateVoices()
      window.speechSynthesis.onvoiceschanged = updateVoices
    }
  }, [])

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

  // Find preferred voice matching male / female selection
  const getPreferredVoice = (gender) => {
    if (!('speechSynthesis' in window)) return null
    const vList = voices.length > 0 ? voices : window.speechSynthesis.getVoices()
    if (!vList || vList.length === 0) return null

    const englishVoices = vList.filter((v) => v.lang.startsWith('en'))
    const pool = englishVoices.length > 0 ? englishVoices : vList

    if (gender === 'female') {
      const femaleKeywords = [
        'jenny', 'samantha', 'zira', 'female', 'victoria', 'karen', 'moira', 'fiona',
        'natural', 'google us english', 'eva', 'stephanie', 'aria', 'sara'
      ]
      const matched = pool.find((v) =>
        femaleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      )
      return matched || pool[0]
    } else {
      const maleKeywords = [
        'david', 'guy', 'george', 'mark', 'alex', 'daniel', 'male',
        'google uk english male', 'oliver', 'tom', 'james', 'richard', 'ryan'
      ]
      const matched = pool.find((v) =>
        maleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      )
      return matched || (pool.length > 1 ? pool[1] : pool[0])
    }
  }

  // Text-to-Speech function for AI spoken responses (Male / Female tailored)
  const speakResponse = (text, genderOverride) => {
    if (!speakerEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const activeGender = genderOverride || voiceGender
    // Clean markdown symbols for natural voice narration
    const cleanText = text.replace(/[*_#`\[\]]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)

    if (activeGender === 'female') {
      utterance.rate = 1.05
      utterance.pitch = 1.05
    } else {
      utterance.rate = 0.98
      utterance.pitch = 0.82 // deeper natural masculine pitch
    }

    const preferredVoice = getPreferredVoice(activeGender)
    if (preferredVoice) utterance.voice = preferredVoice

    window.speechSynthesis.speak(utterance)
  }

  // Toggle Voice Gender (Male <-> Female)
  const toggleVoiceGender = () => {
    const nextGender = voiceGender === 'female' ? 'male' : 'female'
    setVoiceGender(nextGender)
    if (speakerEnabled) {
      speakResponse(`Voice switched to ${nextGender}`, nextGender)
    }
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
                  src="/Chatbot.png"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = '/chatbot.png'
                  }}
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
        <>
          {/* Elevated Popup Window - lifted up so close button sits cleanly below */}
          <div className="fixed bottom-24 sm:bottom-26 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] max-h-[calc(100vh-130px)] h-[580px] sm:h-[620px] bg-[#090d16] text-white rounded-[32px] shadow-2xl border-2 border-slate-800 flex flex-col overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
            {/* 1. Collapsible Top Guide Banner & Book Button */}
            {showTopBanner ? (
              <div className="shrink-0 animate-in fade-in duration-200">
                {/* Top Banner Card: Ask me about... (Exact match to Image 2) */}
                <div className="relative bg-[#dff2fd] text-slate-900 rounded-2xl p-4 sm:p-5 m-3.5 mb-2.5 overflow-hidden shadow-xs">
                  {/* Floating Voice Ready Pill */}
                  {showVoiceBanner && (
                    <div className="absolute top-2.5 right-10 z-20 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-slate-200/80 text-[10px] sm:text-[11px] font-bold text-slate-800 animate-in fade-in duration-200">
                      <span className="flex items-center gap-0.5 text-sky-600">
                        <span className="w-0.5 h-2.5 bg-sky-600 animate-pulse" />
                        <span className="w-0.5 h-4 bg-sky-600 animate-pulse delay-75" />
                        <span className="w-0.5 h-2 bg-sky-600 animate-pulse delay-150" />
                      </span>
                      <span>Voice is ready, enable mic to talk</span>
                      <button
                        type="button"
                        onClick={() => setShowVoiceBanner(false)}
                        className="text-slate-400 hover:text-slate-700 ml-1 p-0.5 cursor-pointer"
                        title="Dismiss voice tip"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Close ONLY this banner card to show full chat window */}
                  <button
                    type="button"
                    onClick={() => setShowTopBanner(false)}
                    className="absolute top-2.5 right-2.5 z-30 w-6 h-6 rounded-full bg-slate-900/10 hover:bg-slate-900/25 text-slate-700 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
                    title="Close guide to show full chat"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  <div className="pr-6">
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
              </div>
            ) : (
              /* Compact Top Bar when guide is closed (Full Chat Window Mode) */
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-[#0c121e] shrink-0 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img
                      src="/Chatbot.png"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = '/chatbot.png'
                      }}
                      alt="SupplyShield Concierge"
                      className="w-6 h-6 rounded-full object-cover border border-sky-400/50"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-900 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight">SupplyShield AI Concierge</h3>
                    <p className="text-[10px] text-slate-400">Full Chat View</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTopBanner(true)}
                    className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 hover:bg-sky-950/50 px-2.5 py-1 rounded-lg border border-sky-500/30 transition-all cursor-pointer flex items-center gap-1"
                    title="Show Ask me about recommendations"
                  >
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>Show Guide</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/network-map')}
                    className="text-[11px] font-semibold text-white bg-[#0284c7] hover:bg-[#0369a1] px-2.5 py-1 rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <span>Demo</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Voice Controls Bar: Mic, Speaker & Gender Toggles */}
            <div className="flex items-center justify-center gap-6 sm:gap-8 py-2 px-4 border-b border-slate-800/80 bg-[#0c121e] shrink-0">
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

              {/* Voice Gender Toggle: Female / Male */}
              <button
                type="button"
                onClick={toggleVoiceGender}
                className="flex flex-col items-center gap-1 group cursor-pointer"
                title={`Switch AI voice to ${voiceGender === 'female' ? 'Male' : 'Female'}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all font-bold text-xs ${
                    voiceGender === 'female'
                      ? 'bg-pink-600/25 text-pink-300 border border-pink-500/40 group-hover:bg-pink-600/35'
                      : 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/40 group-hover:bg-indigo-600/35'
                  }`}
                >
                  {voiceGender === 'female' ? '♀' : '♂'}
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200 capitalize flex items-center gap-1">
                  <span>{voiceGender}</span>
                  <span className="text-[9px] text-sky-400 font-normal">⇄</span>
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
                    {/* Bubble with avatar */}
                    <div className={`flex items-end gap-2 max-w-[90%] ${isUser ? 'ml-auto' : ''}`}>
                      {!isUser && (
                        <img
                          src="/Chatbot.png"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = '/chatbot.png'
                          }}
                          alt="SupplyShield Concierge"
                          className="w-6 h-6 rounded-full object-cover border border-sky-400/40 shadow-xs shrink-0 mb-0.5"
                        />
                      )}
                      <div
                        className={`px-4 py-2.5 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-[#0284c7] text-white rounded-2xl rounded-br-xs shadow-md'
                            : 'bg-[#182234] text-slate-200 rounded-2xl rounded-bl-xs border border-slate-800/90 shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
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

            {/* Bottom Input Form (Clean without overlapping close button) */}
            <div className="p-3 bg-[#0c121e] border-t border-slate-800/80 shrink-0">
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

                  {/* Send Button with Up-Arrow */}
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
          </div>

          {/* Floating Close Button - Cleanly positioned BELOW the popup (Exact match to Image 2) */}
          <button
            type="button"
            onClick={() => {
              window.speechSynthesis?.cancel()
              setIsOpen(false)
            }}
            className="fixed bottom-5 sm:bottom-6 right-5 sm:right-6 z-50 w-11 h-11 rounded-full bg-[#111827] hover:bg-slate-800 text-white flex items-center justify-center border-2 border-slate-700 shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-black/50"
            title="Close Chat"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </>
      )}
    </>
  )
}
