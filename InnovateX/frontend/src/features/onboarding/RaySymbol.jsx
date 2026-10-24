import React from 'react'

/**
 * RAY Geometric Symbol
 * 4-petal diamond cross in signature mint-emerald (#10b981 / #34d399)
 * Used for RAY AI Onboarding Agent header & special rotating light-spreading loader
 */
export default function RaySymbol({ size = 32, className = '', isLoader = false }) {
  if (isLoader) {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        {/* Pulsing radiating light glow ring */}
        <div
          className="absolute inset-0 rounded-full animate-ray-light-spread pointer-events-none"
          style={{ width: size * 1.8, height: size * 1.8, margin: -size * 0.4 }}
        />
        {/* Secondary soft outer aura */}
        <div
          className="absolute inset-0 rounded-full animate-ray-halo pointer-events-none"
          style={{ width: size * 2.4, height: size * 2.4, margin: -size * 0.7 }}
        />

        {/* Stepped rotating icon with pause delay */}
        <div
          className="animate-ray-rotate-step relative z-10 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <RaySvg size={size} />
        </div>
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <RaySvg size={size} />
    </div>
  )
}

function RaySvg({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-xs"
    >
      <defs>
        <linearGradient id="rayGradientTop" x1="24" y1="4" x2="24" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="rayGradientBottom" x1="24" y1="44" x2="24" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="rayGradientLeft" x1="4" y1="24" x2="21" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="rayGradientRight" x1="44" y1="24" x2="27" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Top Petal */}
      <path
        d="M21 5C21 4.44772 21.4477 4 22 4H26C26.5523 4 27 4.44772 27 5V19C27 20.1046 26.1046 21 25 21H23C21.8954 21 21 20.1046 21 19V5Z"
        fill="url(#rayGradientTop)"
      />
      {/* Bottom Petal */}
      <path
        d="M21 43C21 43.5523 21.4477 44 22 44H26C26.5523 44 27 43.5523 27 43V29C27 27.8954 26.1046 27 25 27H23C21.8954 27 21 27.8954 21 29V43Z"
        fill="url(#rayGradientBottom)"
      />
      {/* Left Petal */}
      <path
        d="M5 21C4.44772 21 4 21.4477 4 22V26C4 26.5523 4.44772 27 5 27H19C20.1046 27 21 26.1046 21 25V23C21 21.8954 20.1046 21 19 21H5Z"
        fill="url(#rayGradientLeft)"
      />
      {/* Right Petal */}
      <path
        d="M43 21C43.5523 21 44 21.4477 44 22V26C44 26.5523 43.5523 27 43 27H29C27.8954 27 27 26.1046 27 25V23C27 21.8954 27.8954 21 29 21H43Z"
        fill="url(#rayGradientRight)"
      />
    </svg>
  )
}
