import { useState, useEffect, useRef } from 'react'
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Bot,
  Activity,
  CheckCircle2,
  Cpu,
  Clock,
  Compass,
  Zap,
} from 'lucide-react'

// Lifecycle workflow phases on the circular ring
const PHASES = [
  { id: 'detect', name: 'Detect', label: 'Detect demand shocks', icon: AlertTriangle, color: '#f59e0b', angle: 0 },
  { id: 'validate', name: 'Validate', label: 'Validate network constraints', icon: Shield, color: '#0284c7', angle: 72 },
  { id: 'optimize', name: 'Optimize', label: 'Solve MILP optimization', icon: Cpu, color: '#8b5cf6', angle: 144 },
  { id: 'compare', name: 'Compare', label: 'Compare delta trade-offs', icon: TrendingUp, color: '#10b981', angle: 216 },
  { id: 'explain', name: 'Explain', label: 'Explain recovery dispatch', icon: Bot, color: '#06b6d4', angle: 288 },
]

export default function HeroAnimation() {
  const [activePhaseIndex, setActivePhaseIndex] = useState(0)
  const [gaugeValue, setGaugeValue] = useState(60)
  const [robotExpression, setRobotExpression] = useState('happy') // 'happy' | 'thinking' | 'wink' | 'focused'
  const [chatMessageIndex, setChatMessageIndex] = useState(0)
  const [metricDelta, setMetricDelta] = useState(19502)

  // Rotating through phases every 3.8s automatically unless user interacts
  useEffect(() => {
    const gaugeValues = [60, 95, 30, 88, 72]
    const deltas = [19502, 24180, 15400, 28950, 21300]
    const expressions = ['happy', 'focused', 'thinking', 'wink', 'happy']

    const interval = setInterval(() => {
      setActivePhaseIndex((prev) => {
        const next = (prev + 1) % PHASES.length
        setGaugeValue(gaugeValues[next])
        setMetricDelta(deltas[next])
        setRobotExpression(expressions[next])
        setChatMessageIndex((c) => (c + 1) % 4)
        return next
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const currentPhase = PHASES[activePhaseIndex]

  // Chat message script for Card 2
  const CHAT_MESSAGES = [
    {
      role: 'alert',
      text: 'Depot DC-1 highway flooded. 38,000 units stranded across Lane 4.',
      time: '10:42 AM',
    },
    {
      role: 'ai',
      text: 'MILP re-solving: Shifted 4,200 units from Hub Alpha to Store #18 in 1.8s.',
      time: '10:42 AM',
    },
    {
      role: 'success',
      text: 'Zero store stockouts. Expiry write-down risk mitigated by 94.2%.',
      time: '10:43 AM',
    },
    {
      role: 'ai',
      text: 'Dispatch manifests compiled with FEFO shelf-life compliance. Approved.',
      time: '10:43 AM',
    },
  ]

  // Manual phase selection on ring hover/click
  const handleSelectPhase = (index) => {
    setActivePhaseIndex(index)
    const gaugeValues = [60, 95, 30, 88, 72]
    setGaugeValue(gaugeValues[index])
    setRobotExpression(index % 2 === 0 ? 'focused' : 'happy')
  }

  return (
    <div className="relative w-full max-w-[620px] aspect-square flex items-center justify-center select-none">
      {/* Background ambient fluid organic blobs (RELEX style) */}
      <div
        className="absolute -inset-6 rounded-full opacity-60 blur-3xl pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 60% 40%, rgba(56, 189, 248, 0.35) 0%, rgba(2, 132, 199, 0.15) 50%, transparent 75%)`,
        }}
      />
      <div
        className="absolute w-[500px] h-[480px] -bottom-10 -left-10 rounded-full opacity-40 blur-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(186, 230, 253, 0.5) 0%, transparent 70%)',
        }}
      />

      {/* Decorative subtle background supply chain transit curves (RELEX blue vector lines) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
        viewBox="0 0 600 600"
        fill="none"
      >
        <path
          d="M 50 120 C 180 30, 420 80, 550 180 C 650 260, 520 480, 380 540 C 200 620, 80 440, 120 300"
          stroke="#0284c7"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <path
          d="M 120 80 C 300 20, 500 120, 520 320 C 530 450, 350 560, 200 520"
          stroke="#38bdf8"
          strokeWidth="1.2"
        />
      </svg>

      {/* ======================================================== */}
      {/* 02 — ROTATING CIRCULAR WORKFLOW RINGS                    */}
      {/* ======================================================== */}
      <div className="absolute inset-4 flex items-center justify-center pointer-events-none">
        {/* Outer concentric orbit track */}
        <div className="absolute w-[440px] h-[440px] rounded-full border border-sky-200/70" />

        {/* Medium dashed rotating orbit track */}
        <div
          className="absolute w-[360px] h-[360px] rounded-full border border-dashed border-sky-300/80 animate-spin"
          style={{ animationDuration: '48s' }}
        />

        {/* SVG Curved Text ring (RELEX style: "Reduce inventory levels • Plan & execute • Predict demand volatility") */}
        <svg
          className="absolute w-[440px] h-[440px] animate-spin"
          style={{ animationDuration: '60s', animationTimingFunction: 'linear' }}
          viewBox="0 0 440 440"
        >
          <defs>
            <path
              id="workflowOrbitPath"
              d="M 220, 220 m -175, 0 a 175,175 0 1,1 350,0 a 175,175 0 1,1 -350,0"
            />
          </defs>
          <text
            className="text-[10px] tracking-[0.22em] font-semibold uppercase fill-sky-800/80"
            style={{ letterSpacing: '0.24em' }}
          >
            <textPath href="#workflowOrbitPath" startOffset="0%">
              • DETECT DEMAND SHOCKS • VALIDATE CONSTRAINTS • SOLVE MILP OPTIMIZATION • COMPARE DELTAS • EXPLAIN DISPATCH
            </textPath>
          </text>
        </svg>

        {/* Interactive Phase Badges distributed along ring */}
        <div className="absolute inset-0 pointer-events-auto">
          {PHASES.map((phase, idx) => {
            const angleRad = (idx * (360 / PHASES.length) - 90) * (Math.PI / 180)
            const radius = 175
            const x = 310 + radius * Math.cos(angleRad)
            const y = 310 + radius * Math.sin(angleRad)
            const isActive = idx === activePhaseIndex

            return (
              <button
                key={phase.id}
                type="button"
                onClick={() => handleSelectPhase(idx)}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 shadow-sm cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sky-400/40 shadow-md scale-110 ring-4 ring-sky-100'
                    : 'bg-white/95 text-slate-640 hover:bg-sky-50 hover:text-sky-700 border border-sky-100'
                }`}
                title={phase.label}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isActive ? '#ffffff' : phase.color }}
                />
                <span>{phase.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 01 — CENTRAL AI ASSISTANT (SupplyShield Bot)             */}
      {/* Friendly, floating, blinking, animated vector character   */}
      {/* ======================================================== */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-auto cursor-pointer group">
        {/* Soft glowing aura behind the character */}
        <div
          className="w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl"
          style={{
            background:
              'radial-gradient(circle, rgba(240, 249, 255, 0.95) 0%, rgba(224, 242, 254, 0.85) 60%, rgba(186, 230, 253, 0.4) 100%)',
            border: '2px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 20px 45px -10px rgba(2, 132, 199, 0.25), inset 0 2px 6px rgba(255, 255, 255, 0.8)',
          }}
        >
          {/* Animated floating & breathing robot container */}
          <div className="relative flex flex-col items-center transition-transform duration-300 group-hover:scale-105 animate-bounce-subtle">
            {/* Robot Head */}
            <div className="relative w-24 h-20 rounded-[28px] bg-gradient-to-b from-white via-sky-50 to-sky-100 border-2 border-white shadow-md flex items-center justify-center">
              {/* Antenna on top */}
              <div className="absolute -top-4 w-1.5 h-4 bg-sky-300 rounded-full flex items-start justify-center">
                <span className="w-2.5 h-2.5 -top-1.5 absolute rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-ping" />
                <span className="w-2.5 h-2.5 -top-1.5 absolute rounded-full bg-sky-500 shadow-[0_0_6px_#0284c7]" />
              </div>

              {/* Ears / Headphone discs */}
              <div className="absolute -left-2 w-3 h-7 rounded-l-md bg-sky-300 border border-sky-400 shadow-inner" />
              <div className="absolute -right-2 w-3 h-7 rounded-r-md bg-sky-300 border border-sky-400 shadow-inner" />

              {/* Digital Face Visor */}
              <div className="w-[78px] h-12 rounded-[18px] bg-slate-900 shadow-inner border border-sky-300/40 flex items-center justify-center gap-3 px-2">
                {/* Left Eye */}
                <div className="relative flex items-center justify-center">
                  {robotExpression === 'wink' ? (
                    <span className="w-4 h-1 bg-cyan-400 rounded-full" />
                  ) : (
                    <div className="w-3.5 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] flex items-center justify-center animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white -top-0.5 -right-0.5 absolute" />
                    </div>
                  )}
                </div>

                {/* Right Eye */}
                <div className="relative flex items-center justify-center">
                  <div className="w-3.5 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] flex items-center justify-center animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white -top-0.5 -right-0.5 absolute" />
                  </div>
                </div>
              </div>

              {/* Cheeks */}
              <div className="absolute bottom-2 left-3 w-2 h-1 rounded-full bg-rose-300/60" />
              <div className="absolute bottom-2 right-3 w-2 h-1 rounded-full bg-rose-300/60" />
            </div>

            {/* Robot Neck */}
            <div className="w-6 h-1.5 bg-sky-200 rounded-full shadow-inner my-0.5" />

            {/* Robot Torso with Shield Matrix */}
            <div className="relative w-28 h-20 rounded-[24px] bg-gradient-to-b from-white to-sky-100 border-2 border-white shadow-md flex flex-col items-center justify-center p-2">
              {/* Torso Screen: Shield Emblem */}
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-200 flex flex-col items-center justify-center gap-1 shadow-inner">
                <Shield className="w-5 h-5 text-sky-600 fill-sky-200/50" />
                <div className="flex gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                  <span className="w-1 h-1 rounded-full bg-sky-400" />
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                </div>
              </div>

              {/* Arms */}
              <div className="absolute -left-3 top-3 w-3 h-10 rounded-full bg-sky-200 border border-sky-300 transform -rotate-12 shadow-sm" />
              <div className="absolute -right-3 top-3 w-3 h-10 rounded-full bg-sky-200 border border-sky-300 transform rotate-12 shadow-sm" />
            </div>
          </div>
        </div>

        {/* Assistant label tag */}
        <div className="absolute -bottom-3 bg-white/95 border border-sky-200 px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-sky-950">SupplyShield Copilot</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 03 — FLOATING DASHBOARD CARDS                           */}
      {/* ======================================================== */}

      {/* ——— CARD 1 (Top Left): Live Inventory Availability Gauge ——— */}
      <div
        className="absolute top-2 left-0 w-44 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-sky-100 transition-all duration-700 hover:scale-105 z-20"
        style={{
          boxShadow: '0 12px 30px -4px rgba(2, 132, 199, 0.15)',
        }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Store Fill Rate
          </span>
          <span className="text-[9px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md">Live</span>
        </div>

        {/* Animated Semi-Circular Gauge */}
        <div className="relative flex flex-col items-center justify-center my-1">
          <svg className="w-28 h-16" viewBox="0 0 100 55">
            {/* Background Arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* Progress Arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke={gaugeValue < 40 ? '#ef4444' : gaugeValue > 80 ? '#10b981' : '#0284c7'}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="126"
              strokeDashoffset={126 - (126 * gaugeValue) / 100}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Centered Percentage */}
          <div className="absolute bottom-0 flex flex-col items-center">
            <span className="text-2xl font-black tracking-tight text-slate-900 transition-all duration-500">
              {gaugeValue}%
            </span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
          <span className="text-slate-500">FEFO Expiry Risk</span>
          <span className="font-bold text-emerald-600">0 Spoiled</span>
        </div>
      </div>

      {/* ——— CARD 2 (Top Right): Collaborative Disruption & Agent Chat ——— */}
      <div
        className="absolute top-0 right-0 w-52 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-sky-100 transition-all duration-500 hover:scale-105 z-20"
        style={{
          boxShadow: '0 12px 30px -4px rgba(2, 132, 199, 0.15)',
        }}
      >
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100">
          <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-slate-900 leading-none">Autonomous Co-Pilot</h4>
            <span className="text-[9px] text-emerald-600 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Reasoning
            </span>
          </div>
        </div>

        {/* Dynamic chat message */}
        <div className="min-h-[58px] flex flex-col justify-center bg-slate-50 rounded-xl p-2 text-[10.5px] leading-relaxed text-slate-700 border border-slate-100/80">
          <p className="line-clamp-3 font-medium">
            {CHAT_MESSAGES[chatMessageIndex].text}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">
          <span>Latency: 1.4s</span>
          <span className="text-sky-600 font-semibold cursor-pointer flex items-center gap-0.5">
            View Manifest <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>

      {/* ——— CARD 3 (Bottom Left): Demand Volatility & SKU Forecast ——— */}
      <div
        className="absolute bottom-2 left-0 w-48 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-sky-100 transition-all duration-500 hover:scale-105 z-20"
        style={{
          boxShadow: '0 12px 30px -4px rgba(2, 132, 199, 0.15)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-700">Demand Volatility</span>
          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">+38% Peak</span>
        </div>

        {/* Mini SVG Bar + Line combo chart (RELEX style) */}
        <div className="h-16 w-full flex items-end justify-between gap-1 px-1 pt-2">
          {[
            { bar: 30, line: 35 },
            { bar: 50, line: 45 },
            { bar: 75, line: 70 },
            { bar: 95, line: 90 }, // Peak
            { bar: 65, line: 60 },
            { bar: 45, line: 40 },
          ].map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              {/* Dynamic Bar */}
              <div
                className="w-full rounded-t-sm transition-all duration-700"
                style={{
                  height: `${item.bar}%`,
                  backgroundColor: i === 3 ? '#f59e0b' : '#38bdf8',
                  opacity: i === 3 ? 1 : 0.75,
                }}
              />
              <span className="text-[8px] text-slate-400 font-mono">W{i + 1}</span>
            </div>
          ))}
        </div>

        <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Target Accuracy</span>
          <span className="font-bold text-sky-700">98.4%</span>
        </div>
      </div>

      {/* ——— CARD 4 (Bottom Right): Operational Cost & Delta Trade-Off ——— */}
      <div
        className="absolute bottom-2 right-0 w-52 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-sky-100 transition-all duration-500 hover:scale-105 z-20"
        style={{
          boxShadow: '0 12px 30px -4px rgba(2, 132, 199, 0.15)',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Freight Cost Delta</span>
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
        </div>

        <div className="flex items-baseline gap-2 my-1">
          <span className="text-xl font-black text-slate-900 tracking-tight">
            ${metricDelta.toLocaleString()}
          </span>
          <span className="text-[10.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
            +1.21%
          </span>
        </div>

        {/* Dual line trace preview */}
        <div className="h-6 w-full flex items-center">
          <svg className="w-full h-full" viewBox="0 0 160 30" fill="none">
            {/* Cost Baseline */}
            <path
              d="M 0 24 Q 40 20, 80 18 T 160 14"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            {/* Optimized Curve */}
            <path
              d="M 0 20 Q 40 12, 80 8 T 160 4"
              stroke="#0284c7"
              strokeWidth="2.5"
            />
            {/* Highlight Dot */}
            <circle cx="160" cy="4" r="3" fill="#0284c7" />
          </svg>
        </div>

        <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-100 pt-1">
          <span>Service Level</span>
          <span className="font-bold text-sky-800">99.4% Fill</span>
        </div>
      </div>

      {/* ——— FLOATING "Ask SupplyShield" INTERACTION PILL (RELEX Style) ——— */}
      <div
        className="absolute -bottom-7 right-6 z-30 flex items-center gap-2 bg-slate-900 text-white rounded-full px-3.5 py-2 shadow-2xl border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition-all hover:scale-105"
        style={{
          boxShadow: '0 15px 35px rgba(15, 23, 42, 0.35)',
        }}
      >
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
          AI
        </div>
        <span className="text-xs font-semibold pr-1">Ask SupplyShield…</span>
        <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
          <ArrowRight className="w-3 h-3 text-sky-400" />
        </div>
      </div>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(-5px); }
          50% { transform: translateY(5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
