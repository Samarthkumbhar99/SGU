import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react'

/**
 * LandingVideoShowcase
 * Seamlessly merged with page background (zero borders, zero shadows, no dark vignette):
 * - Displays `/Intro.webm` seamlessly like a native static/vector animation on the page
 * - Infinite loop, auto-playing, default muted
 * - Subtle floating light-glassmorphic Unmute and Fullscreen controls
 * - Merged seamlessly with the white/neutral page canvas
 */
export default function LandingVideoShowcase() {
  const [isMuted, setIsMuted] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)
  const videoRef = useRef(null)

  // Listen for native fullscreen changes (e.g., user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        } else if (containerRef.current?.webkitRequestFullscreen) {
          await containerRef.current.webkitRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen()
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err)
    }
  }

  return (
    <section className="relative w-full py-6 sm:py-12 bg-white overflow-hidden select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Seamless animation wrapper - completely borderless, merged with page background */}
        <div
          ref={containerRef}
          className="relative w-full aspect-[16/9] max-h-[620px] flex items-center justify-center bg-white"
        >
          {/* Endless looped auto-playing video acting as a native static animation */}
          <video
            ref={videoRef}
            src="/Intro.webm"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain pointer-events-none"
            style={{
              // Seamless radial edge blend to merge 100% into the white page background
              maskImage: 'radial-gradient(ellipse 92% 88% at 50% 50%, black 75%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 92% 88% at 50% 50%, black 75%, transparent 100%)',
            }}
          />

          {/* Minimalist, unobtrusive floating controls (Mute/Unmute + Fullscreen) */}
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-20 flex items-center gap-2">
            {/* Audio Mute / Unmute Button */}
            <button
              type="button"
              onClick={toggleSound}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="px-3 py-1.5 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-sky-700 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] font-medium text-slate-600">Unmute</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-[11px] font-medium text-sky-700">Muted Off</span>
                </>
              )}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-sky-700 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden sm:inline text-[11px] font-medium text-sky-700">Exit</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline text-[11px] font-medium text-slate-600">Fullscreen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
