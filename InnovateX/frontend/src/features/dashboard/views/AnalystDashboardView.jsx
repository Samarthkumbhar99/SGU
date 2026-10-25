import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  Cpu,
  ShieldCheck,
  FileText,
  Sparkles,
  Zap,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useToast } from '../../../components/ui/Toast.jsx'

// Multi-Week Forecast vs Actuals Model Evaluation
const FORECAST_EVAL_DATA = [
  { week: 'W-38', actual: 16200, lightgbm: 15900, arima: 15400 },
  { week: 'W-39', actual: 17400, lightgbm: 17100, arima: 16800 },
  { week: 'W-40', actual: 18900, lightgbm: 18600, arima: 17900 },
  { week: 'W-41', actual: 18200, lightgbm: 18400, arima: 18900 },
  { week: 'W-42', actual: 19800, lightgbm: 19600, arima: 18800 },
  { week: 'W-43', actual: 21100, lightgbm: 20900, arima: 19700 },
]

export default function AnalystDashboardView({ user, latestRun }) {
  const navigate = useNavigate()
  const toast = useToast()

  const [activeModel, setActiveModel] = useState('Ensemble (LightGBM + ARIMA)')

  return (
    <div className="space-y-6">
      {/* Analyst Model Center Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <BarChart3 size={220} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30">
                📊 Supply Chain Intelligence &amp; Model Center
              </span>
              <span className="text-xs text-purple-200 font-medium">
                Google OR-Tools CP-SAT • ML Forecasting Suite
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Algorithmic Analytics &amp; Solver Workbench
            </h1>
            <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-xl">
              Mathematical modeling of network inventory flows, demand elasticity regression, and discrete MILP transportation minimization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                navigate('/optimization')
                toast.info('Opening MILP Optimization Workbench…', 'Solver')
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-400 hover:bg-purple-300 text-slate-900 font-extrabold text-xs shadow-md transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <Cpu size={14} className="stroke-[2.5]" />
              <span>Launch MILP Solver</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/report?section=forecasting')}
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-xs backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileText size={14} />
              <span>Export Audit PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analyst Specific KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Forecast Accuracy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Forecast Accuracy</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">94.2%</span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">WAPE Metric</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            5.8% Mean Absolute Percentage Error (7-day horizon)
          </div>
        </div>

        {/* KPI 2: Solver Efficiency */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CP-SAT Solve Time</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Cpu size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {latestRun?.solverRuntimeSeconds !== undefined ? `${Math.round(latestRun.solverRuntimeSeconds * 1000)}ms` : '38ms'}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">OPTIMAL</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-2 font-semibold">
            Zero constraint violation (180 linear bounds met)
          </div>
        </div>

        {/* KPI 3: Cost Reduction vs Baseline */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cost Reduction</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Sliders size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">-18.4%</span>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">vs Greedy</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            ₹1,48,200 saved per replenishment dispatch cycle
          </div>
        </div>

        {/* KPI 4: Carbon Intensity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet Carbon Factor</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">0.35</span>
            <span className="text-xs font-bold text-slate-500">kg CO₂e/t-km</span>
          </div>
          <div className="text-[11px] text-teal-600 mt-2 font-semibold">
            Compliant with Green Logistics Bharat Phase VI
          </div>
        </div>
      </div>

      {/* Multi-Week Machine Learning Forecast Evaluation */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-600" />
              <span>Multi-Week Machine Learning Forecast Evaluation</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical backtest comparing actual point-of-sale customer demand against LightGBM and ARIMA projections
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Model Engine:</span>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer"
            >
              <option value="Ensemble (LightGBM + ARIMA)">Ensemble (LightGBM + ARIMA)</option>
              <option value="LightGBM Regressor (Lag 14)">LightGBM Regressor (Lag 14)</option>
              <option value="ARIMA (2,1,2)">ARIMA (2,1,2) Autoregressive</option>
            </select>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={FORECAST_EVAL_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="actualAnalystGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
            <Area type="monotone" dataKey="actual" name="Actual POS Sales" stroke="#9333ea" strokeWidth={2.5} fill="url(#actualAnalystGrad)" />
            <Area type="monotone" dataKey="lightgbm" name="LightGBM Prediction" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" fill="none" />
            <Area type="monotone" dataKey="arima" name="ARIMA Baseline" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Grid: Solver Diagnostics & Disruption Quick-Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CP-SAT Solver Technical Telemetry */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Google OR-Tools CP-SAT Solver State</h3>
              <p className="text-xs text-slate-500">Discrete mixed-integer linear programming diagnostics</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Status: OPTIMAL
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-600 font-medium">Objective Function:</span>
              <span className="font-mono font-bold text-slate-900">Min [ Freight + Stockout + Holding ]</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-600 font-medium">Decision Variables:</span>
              <span className="font-mono font-bold text-slate-900">240 Active Arcs (DC → Store)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-600 font-medium">Demand &amp; Capacity Bounds:</span>
              <span className="font-mono font-bold text-slate-900">180 Strict Linear Constraints</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <span className="text-slate-600 font-medium">Optimality Gap:</span>
              <span className="font-mono font-extrabold text-emerald-600">0.00% (Provably Optimal)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/optimization')}
            className="w-full mt-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Open Interactive MILP Workbench</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Disruption Simulator Sandbox */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Disruption Stress-Testing Sandbox</h3>
                <p className="text-xs text-slate-500">Run sensitivity heuristics against simulated supply shocks</p>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Monte Carlo
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: 'Fuel Price Surcharge Shock',
                  desc: 'Simulate +20% spike in national diesel transport freight rates.',
                  impact: '+ ₹28,400 / cycle',
                  tag: 'Cost Shock',
                },
                {
                  title: 'NH-48 Highway Landslide Disruption',
                  desc: 'Blockade on Pune-Mumbai corridor requiring alternative DC reroute.',
                  impact: '3h 10m detour',
                  tag: 'Corridor Cut',
                },
                {
                  title: 'Festival Demand Surge (+35%)',
                  desc: 'Diwali FMCG peak spike testing warehouse safety buffers.',
                  impact: 'Stockout alert in 2 stores',
                  tag: 'Demand Surge',
                },
              ].map((sc, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{sc.title}</span>
                      <span className="text-[9.5px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                        {sc.tag}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{sc.desc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-rose-600 block">{sc.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/rescue')}
            className="w-full mt-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Simulate Disruption Scenarios in Sandbox</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
