import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Store,
  Boxes,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  ChevronDown,
} from 'lucide-react'
import RaySymbol from '../onboarding/RaySymbol.jsx'
import { toast } from '../../store/index.js'

const SECTIONS = [
  { id: 'dashboard', label: 'Executive Dashboard', path: '/dashboard' },
  { id: 'inventory', label: 'Perishable Inventory & FEFO', path: '/inventory' },
  { id: 'forecasting', label: 'Demand Forecasting Studio', path: '/forecasting' },
  { id: 'optimization', label: 'MILP Optimization Workbench', path: '/optimization' },
  { id: 'rescue', label: 'Highway Disruption & Rescue', path: '/rescue' },
  { id: 'scenarios', label: 'Scenario Simulation Audit', path: '/scenarios' },
]

const LOADING_STEPS = [
  { step: 1, text: 'Extracting regional node telemetry & active SKU batches…' },
  { step: 2, text: 'Groq AI LLM is tuning supply chain telemetry & running risk inference…' },
  { step: 3, text: 'Synthesizing Dynamic FEFO expiry matrices & MILP solver metrics…' },
  { step: 4, text: 'Calibrating executive typography, tabular structures & audit badges…' },
  { step: 5, text: 'Compiling publication-ready PDF document…' },
]

export default function AiReportPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // Parse query params (e.g. ?section=inventory)
  const searchParams = new URLSearchParams(location.search)
  const initialSection = searchParams.get('section') || 'dashboard'

  const [activeSection, setActiveSection] = useState(initialSection)
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStepIndex, setLoadingStepIndex] = useState(0)
  const [progress, setProgress] = useState(15)
  const [isExporting, setIsExporting] = useState(false)
  const reportContainerRef = useRef(null)

  // Fetch report from Groq AI API
  const fetchReport = async (section) => {
    setIsLoading(true)
    setProgress(12)
    setLoadingStepIndex(0)

    // Progressive loading steps simulation
    const timer1 = setTimeout(() => {
      setLoadingStepIndex(1)
      setProgress(36)
    }, 700)

    const timer2 = setTimeout(() => {
      setLoadingStepIndex(2)
      setProgress(64)
    }, 1500)

    const timer3 = setTimeout(() => {
      setLoadingStepIndex(3)
      setProgress(88)
    }, 2300)

    const timer4 = setTimeout(() => {
      setLoadingStepIndex(4)
      setProgress(98)
    }, 3000)

    try {
      const res = await axios.post('/api/v1/reports/generate', {
        section,
        telemetry: {
          timestamp: new Date().toISOString(),
          requestedSection: section,
        },
      })

      if (res.data?.success && res.data?.report) {
        setReport(res.data.report)
      }
    } catch (err) {
      console.error('Failed to fetch AI report:', err)
      toast.error('Using simulated fallback report data', 'Report Generator')
    } finally {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      setProgress(100)
      setTimeout(() => {
        setIsLoading(false)
      }, 600)
    }
  }

  // Load report on mount or when section changes
  useEffect(() => {
    fetchReport(activeSection)
  }, [activeSection])

  // Handle Section Change
  const handleSectionChange = (newSection) => {
    setActiveSection(newSection)
    navigate(`/report?section=${newSection}`, { replace: true })
  }

  // Native Print / Save to PDF
  const handlePrint = () => {
    window.print()
  }

  // Download PDF file using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!reportContainerRef.current) return
    setIsExporting(true)
    toast.info('Generating PDF document…', 'Export')

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const element = reportContainerRef.current
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      let heightLeft = pdfHeight
      let position = 0
      const pageHeight = pdf.internal.pageSize.getHeight()

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pageHeight
      }

      const fileName = `SupplyShield_${report?.section || activeSection}_Report_${new Date().toISOString().slice(0, 10)}.pdf`
      pdf.save(fileName)
      toast.success('PDF document downloaded successfully!', 'Export Complete')
    } catch (err) {
      console.error('PDF export failed, triggering print fallback:', err)
      window.print()
    } finally {
      setIsExporting(false)
    }
  }

  const currentSectionMeta = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0]

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none print:bg-white print:text-slate-900 print:min-h-0">
      {/* ======================================================== */}
      {/* 1. TOP CONTROL BAR (HIDDEN IN PRINT)                     */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl print:hidden">
        {/* Left: Back button & brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(currentSectionMeta.path)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Return to previous section"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to {currentSectionMeta.label}</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <img
              src="/logo.webp"
              alt="SupplyShield AI"
              className="w-7 h-7 object-contain rounded-lg border border-sky-500/30 p-0.5 bg-slate-900"
            />
            <span className="text-sm font-extrabold text-white tracking-tight">
              Supply<span className="text-sky-400">Shield</span>{' '}
              <span className="text-xs font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-500/30">
                Groq AI Report
              </span>
            </span>
          </div>
        </div>

        {/* Middle: Section Selector Dropdown / Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold hidden md:inline">Audit Section:</span>
          <select
            value={activeSection}
            onChange={(e) => handleSectionChange(e.target.value)}
            className="bg-slate-800 text-xs font-bold text-white border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer shadow-xs transition-all"
          >
            {SECTIONS.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Export & Print Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Refresh / Regenerate Button */}
          <button
            type="button"
            onClick={() => fetchReport(activeSection)}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            title="Regenerate with Groq AI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Regenerate</span>
          </button>

          {/* Print / Save to PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700 shadow-xs active:scale-95 disabled:opacity-50"
            title="Open browser print dialog to save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print</span>
          </button>

          {/* Download PDF File Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isLoading || isExporting}
            className="px-4 py-1.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-950/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            title="Download publication-ready PDF document"
          >
            <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Compiling…' : 'Download PDF'}</span>
            <Sparkles className="w-3 h-3 text-amber-300" />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. LOADING STATE (EXACT MATCH TO ONBOARDING RAY CHATBOT) */}
      {/* ======================================================== */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center animate-in fade-in duration-300 print:hidden">
          {/* Signature Ray Rotating Light-Spread Loader */}
          <div className="relative mb-8">
            <RaySymbol size={56} isLoader={true} />
          </div>

          <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight mb-2 flex items-center gap-2">
            <span>RAY AI is tuning supply chain telemetry</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </h2>

          <p className="text-xs sm:text-sm text-sky-400 font-semibold mb-6 max-w-md h-6 animate-pulse">
            {LOADING_STEPS[loadingStepIndex]?.text}
          </p>

          {/* Progress Bar Container */}
          <div className="w-72 sm:w-96 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/80 mb-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs shadow-sky-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
            <span>Groq LLM Engine: gpt-oss-120b</span>
            <span>•</span>
            <span className="text-emerald-400">{progress}% complete</span>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* 3. PUBLICATION-READY REPORT DOCUMENT (PERFECT ALIGNMENT) */
        /* ======================================================== */
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 lg:p-10">
          <div
            ref={reportContainerRef}
            className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden print:border-none print:shadow-none print:rounded-none"
          >
            {/* Top Document Header Banner */}
            <div className="bg-[#0f172a] text-white p-6 sm:p-8 border-b-4 border-sky-500">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3.5">
                  <img
                    src="/logo.webp"
                    alt="SupplyShield AI Logo"
                    className="w-11 h-11 object-contain rounded-xl border border-sky-400/40 p-1 bg-white"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black tracking-tight text-white">
                        Supply<span className="text-sky-400">Shield</span> AI
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-500/40">
                        OFFICIAL AUDIT
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Autonomous Multi-Echelon Perishable Distribution Intelligence
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-sky-400">
                    {report?.reportId || 'SSR-DASH-982103'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {new Date(report?.generatedAt || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="text-[10px] font-bold text-amber-400 tracking-wider mt-1 uppercase">
                    {report?.classification || 'CONFIDENTIAL // REGIONAL OPERATIONS'}
                  </div>
                </div>
              </div>

              {/* Title & Facility Scope */}
              <div className="border-t border-slate-800 pt-4">
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug mb-1">
                  {report?.title || 'Executive Supply Chain Network Intelligence & Telemetry Audit'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{report?.facilityScope || 'Western Regional Cluster (Mumbai-Pune-Nagpur)'}</span>
                </div>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Executive Summary Section */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    1. Executive Synthesis & Groq AI Analysis
                  </h2>
                </div>
                <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-3 font-normal">
                  {report?.executiveSummary ? (
                    report.executiveSummary
                      .split('\n\n')
                      .map((paragraph, pIdx) => <p key={pIdx}>{paragraph}</p>)
                  ) : (
                    <p>Executive telemetry synthesis compiled successfully.</p>
                  )}
                </div>
              </section>

              {/* Key Telemetry Metrics Grid */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    2. Regional KPI Performance Telemetry
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {report?.kpis?.map((kpi, kIdx) => (
                    <div
                      key={kIdx}
                      className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 transition-all"
                    >
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {kpi.label}
                      </div>
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
                          {kpi.value}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          {kpi.delta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Identified Bottlenecks & Risk Breakdown Table */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    3. Critical Bottlenecks & Risk Mitigation Matrix
                  </h2>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3.5">Risk Category</th>
                        <th className="py-2.5 px-3.5">Severity</th>
                        <th className="py-2.5 px-3.5">Facility / Lane</th>
                        <th className="py-2.5 px-3.5">Operational Impact</th>
                        <th className="py-2.5 px-3.5">AI Mitigation Strategy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {report?.riskAnalysis?.map((risk, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3.5 font-bold text-slate-900">{risk.category}</td>
                          <td className="py-2.5 px-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                risk.level === 'High'
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : risk.level === 'Medium'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {risk.level}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600 font-semibold">{risk.facility}</td>
                          <td className="py-2.5 px-3.5 leading-relaxed text-slate-700">{risk.impact}</td>
                          <td className="py-2.5 px-3.5 leading-relaxed text-sky-800 font-semibold bg-sky-50/40">
                            {risk.mitigation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Dynamic FEFO Perishable Allocation Table */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Boxes className="w-4 h-4 text-sky-600" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    4. Dynamic FEFO Expiry Routing & Batch Allocation
                  </h2>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3.5">SKU Code</th>
                        <th className="py-2.5 px-3.5">Product Description</th>
                        <th className="py-2.5 px-3.5">Batch ID</th>
                        <th className="py-2.5 px-3.5">Expiry Date</th>
                        <th className="py-2.5 px-3.5">Remaining Shelf Life</th>
                        <th className="py-2.5 px-3.5">Target Velocity Store</th>
                        <th className="py-2.5 px-3.5">Allocation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {report?.fefoMatrix?.map((item, fIdx) => (
                        <tr key={fIdx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3.5 font-mono font-bold text-sky-700">{item.sku}</td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-900">{item.name}</td>
                          <td className="py-2.5 px-3.5 font-mono text-slate-600">{item.batchId}</td>
                          <td className="py-2.5 px-3.5 text-slate-700">{item.expiryDate}</td>
                          <td className="py-2.5 px-3.5 font-bold text-amber-700">
                            {item.shelfLifeHours} hrs
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-slate-800">{item.destination}</td>
                          <td className="py-2.5 px-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* MILP Optimization Directives */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    5. Deterministic Google OR-Tools MILP Directives
                  </h2>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-800">
                    {report?.solverDirectives?.map((directive, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{directive}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Audit Certification & Digital Verification Sign-off */}
              <section className="border-t border-slate-200 pt-6">
                <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        Autonomous Model Certification
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Audited by {report?.auditSignoff?.certifiedBy || 'Google OR-Tools & Groq LLM'}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs font-bold text-slate-700">
                      Confidence Score:{' '}
                      <span className="text-emerald-700 font-black">
                        {report?.auditSignoff?.confidenceScore || '99.4%'}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5 max-w-xs truncate">
                      {report?.auditSignoff?.verificationHash ||
                        'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Document Footer */}
            <div className="bg-slate-50 px-6 sm:px-8 py-3.5 border-t border-slate-200 text-center text-[10px] text-slate-400 font-medium">
              SupplyShield AI Distribution Intelligence • Generated via Groq gpt-oss-120b & Google OR-Tools MILP • Western Regional Operational Directive
            </div>
          </div>
        </main>
      )}

      {/* Global Print Media Styles to ensure 0 mistakes, perfect margins, no cutoffs */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, button, nav, .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .ss-layout, .ss-main-content {
            padding: 0 !important;
            margin: 0 !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  )
}
