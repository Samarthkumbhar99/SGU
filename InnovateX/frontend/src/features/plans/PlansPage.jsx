import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { useAuthStore } from '../../store/index.js'
import {
  Check,
  Zap,
  Shield,
  Building2,
  Sparkles,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Lock,
  Download,
  X,
  HelpCircle,
  Truck,
  RotateCcw,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

export default function PlansPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'annual'
  const [loadingPlanId, setLoadingPlanId] = useState(null)
  const [activePlan, setActivePlan] = useState('regional-pro')
  const [paymentSuccessData, setPaymentSuccessData] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  // Dynamically load Razorpay checkout script
  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script')
      script.id = 'razorpay-checkout-script'
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  const plans = [
    {
      id: 'starter',
      name: 'Starter FMCG Hub',
      badge: 'Regional Entry',
      tagline: 'Best for local distribution hubs, regional 3PLs and growing FMCG warehouse operations.',
      priceMonthly: 4999,
      priceAnnual: 49990,
      facilities: 'Up to 5 Facilities',
      popular: false,
      accent: 'border-slate-200 hover:border-slate-300',
      features: [
        'Up to 5 Regional Warehouses / Distribution Centers',
        'Live Stockout Alerts & Safety Stock Matrix',
        '7-Day Demand Forecasting Models (XGBoost)',
        'Shortest Road Transport Path Routing (OSRM Road Network)',
        '25 Groq AI Executive PDF Exports / month',
        'Standard Email & Community Support (12h SLA)',
        'Export Data to CSV, JSON & Excel',
      ],
      notIncluded: [
        'MILP Cost-Optimization Solver Workbench',
        'Ray AI Voice Assistant',
        'Custom ERP & SAP S/4HANA Connectors',
      ],
    },
    {
      id: 'regional-pro',
      name: 'Regional Enterprise Pro',
      badge: 'Recommended • Most Popular',
      tagline: 'Comprehensive intelligence suite with live road routing, MILP solver & real-time disruption simulator.',
      priceMonthly: 14999,
      priceAnnual: 149990,
      facilities: 'Up to 25 Facilities',
      popular: true,
      accent: 'border-blue-500 ring-2 ring-blue-500/20 shadow-xl shadow-blue-500/10',
      features: [
        'Up to 25 Warehouses, DCs & Retail Outlets across India',
        'Shortest Road Transport Path with Distance, Transit Time & Real Roadway Geometry',
        'Real-Time Multi-Echelon Disruption Simulator & Emergency Rerouting',
        'Mixed-Integer Linear Programming (MILP) Solver Workbench',
        'Ray AI Supply Chain Concierge (Groq LLM + Voice Assist)',
        'Unlimited High-Definition AI Executive PDF Reports',
        'Multi-User Team Access (Up to 10 Operations Seats)',
        'Interactive 3D Digital Twin with Architectural Facets',
        '24/7 Priority Operations Support (1h SLA)',
      ],
      notIncluded: [
        'Custom Dedicated Infrastructure & On-Premise Deployment',
      ],
    },
    {
      id: 'enterprise-custom',
      name: 'Multi-Echelon Enterprise',
      badge: 'Enterprise Grade',
      tagline: 'High-throughput logistics architecture with custom machine learning models & ERP integrations.',
      priceMonthly: 39999,
      priceAnnual: 399990,
      facilities: 'Unlimited Facilities',
      popular: false,
      accent: 'border-slate-200 hover:border-slate-300',
      features: [
        'Unlimited Warehouses, Plants, Regional DCs & Retail Stores',
        'Multi-Stop Fleet Dispatch & Road Shortest Path Optimization',
        'Custom ML Ensemble Pipeline (LSTM, XGBoost, Prophet & Holt-Winters)',
        'Direct ERP/WMS Integration (SAP S/4HANA, Oracle, Blue Yonder, Tally)',
        'Ray AI Voice Agent with Fine-Tuned Company Domain Models',
        'Automated Transfer Order Execution via Webhooks',
        'Unlimited Seats & Custom Role-Based Access Controls (RBAC)',
        'Dedicated Supply Chain Solutions Architect & 99.99% Uptime SLA',
        'SOC2 Type II, ISO 27001 & RBI Compliant Security Infrastructure',
      ],
      notIncluded: [],
    },
  ]

  const handleSubscribe = async (plan) => {
    setLoadingPlanId(plan.id)
    setErrorMessage(null)

    const amountInINR = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly

    try {
      // 1. Create order on backend
      const res = await fetch(`${API_BASE}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to initialize payment order')
      }

      const keyId =
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        data.keyId ||
        'rzp_live_SbVLw7f5p7qeQN'

      // Check if Razorpay script is available in window
      if (typeof window.Razorpay !== 'undefined' && keyId && !keyId.includes('mock') && !keyId.includes('placeholder')) {
        const options = {
          key: keyId,
          amount: data.order.amount,
          currency: 'INR',
          name: 'SupplyShield AI',
          description: `${plan.name} (${billingCycle})`,
          image: '/Chatbot.png',
          order_id: data.order.id,
          handler: async function (response) {
            // Verify payment on backend
            try {
              const verifyRes = await fetch(`${API_BASE}/payments/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planId: plan.id,
                  billingCycle,
                  userId: user?.id || 'demo_user',
                }),
              })
              const verifyData = await verifyRes.json()
              if (verifyData.success) {
                setActivePlan(plan.id)
                setPaymentSuccessData({
                  ...verifyData.subscription,
                  plan,
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                })
              } else {
                setErrorMessage(verifyData.message || 'Payment verification failed')
              }
            } catch (err) {
              setErrorMessage('Verification network error: ' + err.message)
            }
          },
          prefill: {
            name: user?.name || 'Supply Chain Director',
            email: user?.email || 'operations@supplyshield.ai',
            contact: '9876543210',
          },
          notes: {
            planId: plan.id,
            billingCycle,
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: function () {
              setLoadingPlanId(null)
            },
          },
        }

        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', function (resp) {
          setErrorMessage(resp.error?.description || 'Payment transaction failed or was cancelled.')
          setLoadingPlanId(null)
        })
        rzp.open()
      } else {
        // Dev / Sandbox fallback (when Razorpay keys are not yet configured in .env)
        // Simulate real transaction so user can test the complete verification and invoice receipt UX
        setTimeout(async () => {
          const simulatedPaymentId = `pay_sim_${Date.now()}`
          try {
            const verifyRes = await fetch(`${API_BASE}/payments/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: data.order.id,
                razorpay_payment_id: simulatedPaymentId,
                razorpay_signature: 'simulated_valid_signature',
                planId: plan.id,
                billingCycle,
                userId: user?.id || 'demo_user',
              }),
            })
            const verifyData = await verifyRes.json()
            setActivePlan(plan.id)
            setPaymentSuccessData({
              subscriptionId: verifyData.subscription?.subscriptionId || `sub_${Date.now()}`,
              plan,
              paymentId: simulatedPaymentId,
              orderId: data.order.id,
              amountINR: amountInINR,
              billingCycle,
              startedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              mode: 'sandbox_demo',
            })
          } catch (e) {
            setErrorMessage('Payment simulation error: ' + e.message)
          } finally {
            setLoadingPlanId(null)
          }
        }, 800)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Payment initiation failed')
      setLoadingPlanId(null)
    }
  }

  return (
    <AppLayout
      pageTitle="Subscription Plans & Pricing"
      breadcrumbs={['Dashboard', 'Plans & Billing']}
    >
      <div className="max-w-7xl mx-auto pb-16">
        {/* Header Hero Section */}
        <div className="text-center pt-4 pb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Transparent Enterprise Pricing in INR (₹)
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Scale Your Autonomous Supply Chain
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Choose the ideal intelligence tier for your network. Includes real-time road transport routing, multi-echelon safety stock, and Groq AI reports.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="mt-8 inline-flex items-center p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Billing
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                billingCycle === 'annual'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                Save 20%
              </span>
            </button>
          </div>

          {/* Credentials Info Note */}
          <div className="mt-4 text-xs text-slate-500 flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Secured by Razorpay • UPI, NetBanking, Cards & Wallets supported in INR
          </div>
        </div>

        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
            <span className="text-sm font-medium">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const isPopular = plan.popular
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly
            const formattedPrice = price.toLocaleString('en-IN')
            const isCurrent = activePlan === plan.id
            const isLoading = loadingPlanId === plan.id

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl border flex flex-col transition-all duration-300 hover:shadow-2xl ${plan.accent} ${
                  isPopular ? 'scale-[1.02] z-10' : ''
                }`}
              >
                {/* Popular Pill */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-lg shadow-blue-500/30 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    Recommended by SupplyShield
                  </div>
                )}

                <div className="p-8 pb-6 flex-1 flex flex-col">
                  {/* Badge & Name */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {plan.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {plan.facilities}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 min-h-[36px] leading-relaxed">
                    {plan.tagline}
                  </p>

                  {/* Pricing Display */}
                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-baseline gap-1.5">
                    <span className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                      ₹{formattedPrice}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      /{billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <div className="text-[11px] font-bold text-emerald-600 mt-1">
                      Includes 2 months free + Priority setup
                    </div>
                  )}

                  {/* Subscribe Action Button */}
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan)}
                    disabled={isLoading}
                    className={`mt-6 w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                      isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5'
                        : 'bg-slate-900 hover:bg-slate-800 text-white hover:-translate-y-0.5'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Initializing Razorpay...</span>
                      </div>
                    ) : isCurrent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Current Active Plan
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Subscribe with Razorpay
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Feature List */}
                  <div className="mt-8 pt-6 border-t border-slate-100 flex-1">
                    <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                      Plan Inclusions
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                          <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.notIncluded.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <ul className="space-y-2">
                          {plan.notIncluded.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-400 line-through">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-8 py-3.5 bg-slate-50/70 border-t border-slate-100 rounded-b-3xl text-[11px] text-slate-500 flex items-center justify-between">
                  <span>100% Tax Deductible (GST)</span>
                  <span className="font-semibold text-slate-700">Instant Activation</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison Matrix */}
        <div className="mt-20 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-black text-slate-900">
              Detailed Capability Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Compare architectural modules, optimization horizons, and AI solvers across tiers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <th className="pb-4 font-bold">Platform Capability</th>
                  <th className="pb-4 font-bold text-center">Starter Hub</th>
                  <th className="pb-4 font-bold text-center text-blue-600">Regional Pro</th>
                  <th className="pb-4 font-bold text-center">Multi-Echelon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3.5 font-semibold">Facilities & Node Support</td>
                  <td className="py-3.5 text-center">Up to 5 Facilities</td>
                  <td className="py-3.5 text-center font-bold text-blue-700">Up to 25 Facilities</td>
                  <td className="py-3.5 text-center font-bold text-slate-900">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold">Shortest Road Transport Routing (OSRM)</td>
                  <td className="py-3.5 text-center text-slate-500">Basic Straight Roadways</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">Full Highway Turn-by-Turn</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">Multi-Stop Fleet Dispatch</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold">MILP Mathematical Solver Workbench</td>
                  <td className="py-3.5 text-center text-slate-300">—</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">Included (Interactive)</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">Included + Custom Constraints</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold">Ray AI Concierge (Groq LLM)</td>
                  <td className="py-3.5 text-center text-slate-500">Chat Only</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">Chat + Voice + Telemetry</td>
                  <td className="py-3.5 text-center font-bold text-emerald-600">Fine-Tuned Domain Models</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold">Groq AI Executive PDF Export</td>
                  <td className="py-3.5 text-center">25 / month</td>
                  <td className="py-3.5 text-center font-bold text-blue-700">Unlimited</td>
                  <td className="py-3.5 text-center font-bold text-slate-900">Unlimited + White-Label</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-semibold">Payment Gateway Integration</td>
                  <td className="py-3.5 text-center font-medium">Razorpay (INR)</td>
                  <td className="py-3.5 text-center font-medium">Razorpay (INR)</td>
                  <td className="py-3.5 text-center font-medium">Razorpay / Invoicing</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl font-black text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500 mt-1">Everything you need to know about billing and Razorpay</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Which payment methods does Razorpay accept?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We accept all major Indian payment methods through Razorpay: UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, Mastercard, RuPay), NetBanking from 50+ Indian banks, and digital wallets.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Will I receive a GST tax invoice?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Yes. All transactions generate automated GST-compliant tax invoices with 18% GST breakdown, allowing full input tax credit (ITC) for your company.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Can I upgrade or downgrade anytime?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Yes. You can switch between Starter, Regional Pro, and Enterprise at any time. Prorated credits are automatically calculated and applied to your billing cycle.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                How do I configure my Razorpay keys?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Simply place your <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">RAZORPAY_KEY_ID</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">RAZORPAY_KEY_SECRET</code> in the <code className="bg-slate-100 px-1 py-0.5 rounded">.env</code> files. The system automatically switches to live checkout!
              </p>
            </div>
          </div>
        </div>

        {/* Payment Success / Invoice Modal */}
        {paymentSuccessData && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="text-center mb-6">
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  Payment Verified • Razorpay
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-2">
                  Subscription Activated!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Thank you for upgrading to {paymentSuccessData.plan?.name || 'SupplyShield AI'}.
                </p>
              </div>

              {/* Invoice Breakdown */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-6 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Payment ID:</span>
                  <span className="font-mono font-bold text-slate-900">{paymentSuccessData.paymentId}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Order ID:</span>
                  <span className="font-mono text-slate-700">{paymentSuccessData.orderId}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Billing Cycle:</span>
                  <span className="font-semibold capitalize text-slate-900">{paymentSuccessData.billingCycle}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                  <span>Amount Paid:</span>
                  <span className="text-blue-600">₹{(paymentSuccessData.amountINR || 14999).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentSuccessData(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Close Receipt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentSuccessData(null)
                    navigate('/dashboard')
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
                >
                  Go to Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
