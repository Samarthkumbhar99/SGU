import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react'

/**
 * LandingVideoShowcase
 * Freely displayed, full-width showcase video directly below the social proof strip:
 * - Plays `/Intro.webm` in an infinite loop
 * - Default muted with an interactive Unmute/Mute toggle
 * - Fullscreen toggle option with native Fullscreen API support
 * - Freely displayed (no restrictive outer card/container or inner padding boxes)
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
    <section className="relative w-full py-6 sm:py-10 overflow-hidden bg-slate-900/2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Freely Displayed Video Player without bounding card container */}
        <div
          ref={containerRef}
          className="group relative w-full aspect-[16/9] max-h-[640px] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 shadow-2xl shadow-sky-950/15 ring-1 ring-slate-900/10"
        >
          {/* Endless looped auto-playing video */}
          <video
            ref={videoRef}
            src="/Intro.webm"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover select-none"
          />

          {/* Subtle gradient vignette at bottom to elevate floating controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

          {/* Floating Top-Left Status Pill */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 pointer-events-none">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/10 text-white/90 text-xs font-semibold shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Logistics Simulation Engine
            </span>
          </div>

          {/* Floating Bottom-Right Action Controls (Mute/Unmute + Fullscreen) */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex items-center gap-2.5">
            {/* Audio Mute / Unmute Button */}
            <button
              type="button"
              onClick={toggleSound}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white/90 hover:text-white backdrop-blur-md border border-white/15 shadow-xl flex items-center gap-2 text-xs font-medium transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-slate-300" />
                  <span className="hidden sm:inline">Unmute</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-sky-400" />
                  <span className="hidden sm:inline text-sky-400">Muted Off</span>
                </>
              )}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white/90 hover:text-white backdrop-blur-md border border-white/15 shadow-xl flex items-center gap-2 text-xs font-medium transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-sky-400" />
                  <span className="hidden sm:inline text-sky-400">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-slate-300" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
