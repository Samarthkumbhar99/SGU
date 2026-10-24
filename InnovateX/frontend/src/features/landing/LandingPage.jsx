import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import LandingNavbar from './LandingNavbar.jsx'
import HeroAnimation from './HeroAnimation.jsx'
import DisruptionSimulator from './DisruptionSimulator.jsx'
import FeatureShowcase from './FeatureShowcase.jsx'
import RoiCalculator from './RoiCalculator.jsx'
import PersonaSection from './PersonaSection.jsx'
import VariableProximity from '../../components/ui/VariableProximity.jsx'
import {
  Shield,
  ArrowRight,
  Play,
  CheckCircle2,
  Cpu,
  Clock,
  Sparkles,
  BarChart3,
  Boxes,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

// FAQ Items
const FAQS = [
  {
    q: 'How does SupplyShield AI eliminate phantom inventory?',
    a: 'Unlike heuristic or probabilistic schedulers that make guesses about stock availability, SupplyShield AI enforces deterministic Google OR-Tools Mixed-Integer Linear Programming (MILP). Flow conservation constraints guarantee that every single unit allocated from a regional warehouse physically exists and respects loading dock bounds.',
  },
  {
    q: 'How fast does the engine re-plan during severe disruptions?',
    a: 'The engine solves full network instances (3–5 regional DCs, 10–50 retail stores, and hundreds of SKU batches) in ≤ 2.8 seconds. This allows distribution operations managers to simulate flood re-routings, sudden demand spikes, and highway closures in real time before morning dispatch.',
  },
  {
    q: 'What is Dynamic FEFO and how does it prevent food waste?',
    a: 'Dynamic First-Expired, First-Out (FEFO) pairs warehouse batch expiration dates with retail store sales velocities and transit lead times. If a batch is nearing its expiration date, SupplyShield automatically prioritizes routing it to high-velocity metropolitan stores where it will sell before spoiling.',
  },
  {
    q: 'Are the AI explanations generated without hallucinations?',
    a: 'Yes. SupplyShield AI’s explainer engine is strictly evidence-grounded. It operates with a temperature of 0.0 and only translates mathematical solver deltas (shadow prices, dual variables, route freight deltas) into human ops rationale, ensuring 100% auditability.',
  },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null)
  const heroTitleRef = useRef(null)

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased overflow-x-hidden selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <LandingNavbar />

      {/* ======================================================== */}
      {/* HERO SECTION (Exact RELEX Solutions visual theme)        */}
      {/* ======================================================== */}
      <section
        id="hero"
        className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden bg-gradient-to-b from-sky-50/50 via-white to-white"
      >
        {/* Soft fluid background blobs (RELEX aesthetic) */}
        <div className="absolute top-10 -left-20 w-[600px] h-[600px] bg-gradient-to-br from-sky-200/40 via-sky-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-0 w-[550px] h-[550px] bg-gradient-to-bl from-blue-200/30 via-sky-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 flex flex-col items-start">

              {/* Main Headline with VariableProximity & Proper Cursive Accent */}
              <h1
                ref={heroTitleRef}
                className="text-4xl sm:text-5xl lg:text-[3.35rem] font-extrabold text-slate-900 tracking-tight leading-[1.14] mb-6 select-none"
                style={{ position: 'relative' }}
              >
                <VariableProximity
                  label="An AI-native platform for"
                  className="text-slate-900 inline"
                  fromFontVariationSettings="'wght' 700, 'opsz' 32"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={heroTitleRef}
                  radius={110}
                  falloff="linear"
                  smoothing={0.2}
                />{' '}
                <VariableProximity
                  label="zero-stockout"
                  className="font-proper-cursive text-sky-600 inline text-[1.18em] px-1"
                  fromFontVariationSettings="'wght' 500"
                  toFontVariationSettings="'wght' 700"
                  containerRef={heroTitleRef}
                  radius={110}
                  falloff="linear"
                  smoothing={0.2}
                />{' '}
                <VariableProximity
                  label="distribution planning"
                  className="text-slate-900 inline"
                  fromFontVariationSettings="'wght' 700, 'opsz' 32"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={heroTitleRef}
                  radius={110}
                  falloff="linear"
                  smoothing={0.2}
                />
              </h1>

              {/* Sub-copy */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6 font-normal">
                SupplyShield provides a unified, AI-native decision engine that FMCG retailers, distributors,
                and wholesalers use to improve forecast accuracy, eliminate store stockouts, optimize batch inventory,
                and re-plan dispatches seamlessly in under 2.8 seconds.
              </p>

              {/* Grounding guarantee */}
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-8 border-l-2 border-sky-500 pl-3.5">
                By combining built-in <span className="font-semibold text-slate-800">Google OR-Tools MILP</span> and{' '}
                <span className="font-semibold text-slate-800">evidence-grounded AI</span> with deep supply chain
                expertise, SupplyShield drives zero phantom stock, strict FEFO compliance, and profitable growth at scale.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-12">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-7 py-4 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold shadow-lg shadow-sky-600/30 transition-all hover:scale-105"
                >
                  <span>Launch Live Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#simulator"
                  className="flex items-center gap-2 px-6 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold border border-slate-300 shadow-sm transition-all hover:border-sky-400"
                >
                  <Play className="w-4 h-4 text-sky-600 fill-sky-600/20" />
                  <span>Why SupplyShield?</span>
                </a>
              </div>

              {/* Trust & Proof Metrics */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200/80 w-full">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">99.4%</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Store Fill Rate</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-sky-600 font-mono">&lt;2.8s</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">MILP Solve Time</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">0%</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Phantom Inventory</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Visual Animation Column */}
            <div className="lg:col-span-6 flex items-center justify-center relative">
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* TRUSTED BY / SOCIAL PROOF STRIP                         */}
      {/* ======================================================== */}
      <section className="py-8 bg-slate-50/80 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Engineered for High-Velocity Regional Logistics & Distribution Centers
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all text-xs font-bold text-slate-600">
            <span className="flex items-center gap-2 text-sm font-extrabold tracking-tight">
              <Boxes className="w-4 h-4 text-sky-600" /> FMCG Retail Networks
            </span>
            <span className="flex items-center gap-2 text-sm font-extrabold tracking-tight">
              <Shield className="w-4 h-4 text-sky-600" /> Cold-Chain Logistics
            </span>
            <span className="flex items-center gap-2 text-sm font-extrabold tracking-tight">
              <Cpu className="w-4 h-4 text-sky-600" /> Google OR-Tools Powered
            </span>
            <span className="flex items-center gap-2 text-sm font-extrabold tracking-tight">
              <Clock className="w-4 h-4 text-sky-600" /> FEFO Expiry Defense
            </span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* INTERACTIVE DISRUPTION SIMULATOR SANDBOX                 */}
      {/* ======================================================== */}
      <div id="simulator">
        <DisruptionSimulator />
      </div>

      {/* ======================================================== */}
      {/* ARCHITECTURAL PILLARS & SPECIFICATIONS                  */}
      {/* ======================================================== */}
      <div id="architecture">
        <FeatureShowcase />
      </div>

      {/* ======================================================== */}
      {/* QUANTIFIABLE ROI CALCULATOR                             */}
      {/* ======================================================== */}
      <div id="roi">
        <RoiCalculator />
      </div>

      {/* ======================================================== */}
      {/* PERSONA EMPATHY PROFILES                                */}
      {/* ======================================================== */}
      <div id="personas">
        <PersonaSection />
      </div>

      {/* ======================================================== */}
      {/* FAQ ACCORDION                                            */}
      {/* ======================================================== */}
      {/* FAQ ACCORDION                                            */}
      {/* ======================================================== */}
      <section className="py-24 bg-slate-50/70 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider mb-4">
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              Frequently Asked Questions
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold text-slate-900 tracking-tight leading-tight">
              Everything you need to know about{' '}
              <span className="font-cursive text-sky-600 font-semibold italic text-[1.08em] px-1">
                SupplyShield
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                  >
                    <span className="font-bold text-slate-900 text-base">{faq.q}</span>
                    <span className="text-slate-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-5 h-5 text-sky-600" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* CALL TO ACTION BANNER (Refined Enterprise Design)        */}
      {/* ======================================================== */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(2,132,199,0.25),transparent_70%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Deterministic Global Optimality · Zero Phantom Inventory
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6 leading-tight">
            Ready to stop bleeding margins on{' '}
            <span className="font-cursive text-sky-400 font-semibold italic text-[1.08em] px-1">
              stockouts & expiry
            </span>
            ?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            Launch the SupplyShield AI distribution intelligence engine now and generate mathematically optimal dispatch manifests in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="px-8 py-4 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-sm font-extrabold shadow-lg shadow-sky-500/30 transition-all hover:scale-105"
            >
              Launch Live Application
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-extrabold border border-white/20 transition-all backdrop-blur-sm"
            >
              Sign In to Your Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* FOOTER                                                   */}
      {/* ======================================================== */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2.5 text-white font-extrabold text-base mb-4">
                <img src="/logo.webp" alt="SupplyShield AI Logo" className="w-6 h-6 object-contain rounded" />
                <span>SupplyShield AI</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Adaptive distribution intelligence and inventory optimization engine for FMCG supply chains.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-3">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#simulator" className="hover:text-white transition-colors">Disruption Simulator</a></li>
                <li><a href="#architecture" className="hover:text-white transition-colors">OR-Tools MILP Solver</a></li>
                <li><a href="#architecture" className="hover:text-white transition-colors">12-Point Integrity Gate</a></li>
                <li><a href="#architecture" className="hover:text-white transition-colors">Dynamic FEFO Rescue</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-3">Personas</h4>
              <ul className="space-y-2">
                <li><a href="#personas" className="hover:text-white transition-colors">Distribution Ops Manager</a></li>
                <li><a href="#personas" className="hover:text-white transition-colors">Warehouse Batch Controller</a></li>
                <li><a href="#personas" className="hover:text-white transition-colors">Chief Supply Chain Analyst</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-3">Engineering</h4>
              <ul className="space-y-2">
                <li><span className="text-slate-500">Google OR-Tools v9.8</span></li>
                <li><span className="text-slate-500">React 19 + GSAP + Tailwind</span></li>
                <li><span className="text-slate-500">FastAPI & Express Gateway</span></li>
                <li><span className="text-emerald-400 font-semibold">● System All Operational</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <p>© 2026 InnovateX — SupplyShield AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/login" className="hover:text-slate-300">Sign In</Link>
              <Link to="/dashboard" className="hover:text-slate-300">Dashboard</Link>
              <a href="https://github.com/Samarthkumbhar99/SGU" target="_blank" rel="noreferrer" className="hover:text-slate-300">GitHub Repository</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
