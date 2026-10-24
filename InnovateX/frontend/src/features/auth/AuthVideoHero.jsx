import { useState, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

/**
 * AuthVideoHero
 * Left-side hero for Login & Signup pages:
 * - Plays `/Intro.webm` in an endless loop
 * - Default auto-muted with a single floating mute/unmute audio button
 * - No video player controls or click interactions so it acts as a seamless static animation
 * - Light bluish gradient container with subtle ambient glassmorphism
 */
export default function AuthVideoHero() {
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef(null)

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <div
      className="relative flex flex-col justify-between overflow-hidden p-6 sm:p-8 lg:p-10 select-none h-full min-h-[500px]"
      style={{
        background: 'linear-gradient(150deg, #f0f7ff 0%, #e0f2fe 45%, #dbeafe 100%)',
      }}
    >
      {/* Soft fluid light blue blobs */}
      <div
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(186, 230, 253, 0.8) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(191, 219, 254, 0.7) 0%, transparent 70%)' }}
      />

      {/* Top Header Bar: Logo + Brand + Mute Button */}
      <div className="relative z-20 flex items-center justify-between w-full mb-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.webp"
            alt="SupplyShield AI Logo"
            className="w-10 h-10 rounded-xl object-contain shadow-xs bg-white p-1 border border-sky-100"
          />
          <div>
            <div className="text-base font-extrabold text-slate-900 leading-tight tracking-tight">
              SupplyShield AI
            </div>
            <div className="text-[11px] font-bold text-sky-700 tracking-wider uppercase">
              Distribution Intelligence
            </div>
          </div>
        </div>

        {/* Audio Mute/Unmute Icon Button */}
        <button
          type="button"
          onClick={toggleSound}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-sky-700 backdrop-blur-md border border-sky-200/80 shadow-xs flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-sky-600" />}
        </button>
      </div>

      {/* Center Video Container: Auto-playing endless loop, no controls */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-auto w-full">
        <div className="w-full max-w-lg aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-xl shadow-sky-900/10 border border-white/80 bg-white/40 backdrop-blur-xs relative flex items-center justify-center">
          <video
            ref={videoRef}
            src="/Intro.webm"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none"
            style={{ pointerEvents: 'none' }}
          />

          {/* Subtle light reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Bottom Subtitle / Tagline */}
      <div className="relative z-20 pt-4 flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold text-slate-700">Autonomous FMCG Distribution Loop</span>
        <span className="font-mono text-[11px] text-sky-700 bg-white/70 px-2.5 py-0.5 rounded-full border border-sky-200/80">
          ● Live Simulation
        </span>
      </div>
    </div>
  )
}
