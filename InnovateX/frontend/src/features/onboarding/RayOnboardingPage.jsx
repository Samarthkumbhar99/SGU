import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useEntityStore, toast } from '../../store/index.js'
import RaySymbol from './RaySymbol.jsx'
import {
  ArrowRight,
  ArrowUp,
  MapPin,
  Building2,
  Boxes,
  CheckCircle2,
  Search,
  Sparkles,
  Phone,
  ShieldCheck,
  Plus,
  RefreshCw,
  Clock,
  Compass,
} from 'lucide-react'

/**
 * Onboarding Top Navbar
 * Shown across the entire AI onboarding flow:
 * - Brand logo & name
 * - Operational setup badge
 * - NO other navlinks (platform/inventory/network only display after dashboard launches)
 * - "Skip for now" option for general users
 */
function OnboardingNavbar({ user, onSkip }) {
  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.webp"
          alt="SupplyShield AI Logo"
          className="w-9 h-9 object-contain rounded-xl shadow-xs border border-sky-100 p-0.5 bg-white"
        />
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            Supply<span className="text-sky-600">Shield</span> <span className="text-slate-900 font-extrabold">AI</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
            AI Setup & KYC
          </span>
        </div>
      </div>

      {/* Middle: Clean / Minimalist (NO OTHER NAVLINKS — only appear once in dashboard) */}
      <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
        <span>Live FMCG Calibration Channel</span>
      </div>

      {/* Right: User identity & Skip for now button for general users */}
      <div className="flex items-center gap-3">
        {user?.name && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200 text-xs font-semibold text-slate-700">
            <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate max-w-[120px]">{user.name}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 hover:text-sky-800 border border-sky-200 transition-all hover:scale-105 cursor-pointer shadow-xs"
          title="Skip setup and proceed straight to dashboard with defaults"
        >
          <span>Skip for now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  )
}

export default function RayOnboardingPage() {
  const navigate = useNavigate()
  const { user, token, updateUser } = useAuthStore()
  const { setLiveLocation, addStore, addWarehouse } = useEntityStore()

  // Phase: 'intro' | 'chat'
  const [phase, setPhase] = useState('intro')
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [textInput, setTextInput] = useState('')

  // User responses state
  const [selectedRole, setSelectedRole] = useState(user?.role || 'Retailer')
  const [companyName, setCompanyName] = useState(user?.company || '')
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '')
  const [locationData, setLocationData] = useState(user?.liveLocation || null)
  const [isLocating, setIsLocating] = useState(false)

  // Entity choice state ('create' | 'search')
  const [entityChoice, setEntityChoice] = useState('create')
  const [newEntityName, setNewEntityName] = useState('')
  const [newEntityCategory, setNewEntityCategory] = useState('Supermarket')
  const [newEntityCapacity, setNewEntityCapacity] = useState('15000')

  // Search existing entity
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedEntityForAccess, setSelectedEntityForAccess] = useState(null)
  const [accessReason, setAccessReason] = useState('')
  const [accessRequested, setAccessRequested] = useState(false)

  // Chat message history
  const [chatHistory, setChatHistory] = useState([])
  const chatBottomRef = useRef(null)

  // Auto transition from intro to chat after 2.4s
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('chat')
    }, 2400)
    return () => clearTimeout(timer)
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [step, isLoading, chatHistory])

  // Request browser live GPS
  const handleRequestLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
          city: 'Auto-Detected GPS Node',
          address: `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`,
        }
        setLocationData(coords)
        setLiveLocation(coords)
        setIsLocating(false)
        toast.success(`Live GPS verified (±${coords.accuracy}m)`, 'Coordinates Locked')

        // Sync with backend if logged in
        if (token) {
          try {
            await fetch('http://localhost:5000/api/v1/entities/location', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(coords),
            })
          } catch (e) {
            console.error('Failed to sync location to backend:', e)
          }
        }
      },
      (err) => {
        setIsLocating(false)
        toast.warning(
          'Using regional default coordinates (Mumbai Central Hub). You can update this anytime in Dashboard settings.',
          'Location Permission Skipped'
        )
        // Fallback default
        const fallback = {
          latitude: 19.076,
          longitude: 72.8777,
          accuracy: 50,
          city: 'Mumbai Central Hub',
          address: 'Bandra Retail Corridor',
        }
        setLocationData(fallback)
        setLiveLocation(fallback)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  // Search existing network stores/warehouses
  const handleSearchNetwork = async (query) => {
    setSearchQuery(query)
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const type = selectedRole.toLowerCase().includes('ware') ? 'warehouse' : 'store'
      const res = await fetch(`http://localhost:5000/api/v1/entities/search?q=${encodeURIComponent(query)}&type=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (data.success) {
        const items = type === 'warehouse' ? data.data.warehouses : data.data.stores
        setSearchResults(items)
      }
    } catch (e) {
      console.error('Search failed:', e)
    } finally {
      setIsSearching(false)
    }
  }

  // Request Access to existing entity
  const handleSendAccessRequest = async () => {
    if (!selectedEntityForAccess) return

    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/v1/entities/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetType: selectedRole.toLowerCase().includes('ware') ? 'Warehouse' : 'Store',
          targetId: selectedEntityForAccess._id,
          roleRequested: 'Co-Manager',
          reason: accessReason || 'Requesting co-manager authorization during onboarding.',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAccessRequested(true)
        toast.success(
          `Access request sent to ${selectedEntityForAccess.owner?.name || 'entity manager'}.`,
          'Request Submitted'
        )
      } else {
        toast.error(data.message || 'Could not submit request')
      }
    } catch (e) {
      toast.error('Network error requesting access')
    } finally {
      setIsLoading(false)
    }
  }

  // Advance to next onboarding step with the special light-spreading rotating loader
  const handleAdvanceStep = async (nextStepNum) => {
    setIsLoading(true)
    // Simulate smart thinking delay so the rotating light-spreading loader displays gracefully
    setTimeout(async () => {
      setStep(nextStepNum)
      setIsLoading(false)
    }, 1100)
  }

  // Skip for now option for general users
  const handleSkipOnboarding = async () => {
    setIsLoading(true)
    try {
      await fetch('http://localhost:5000/api/v1/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: selectedRole || user?.role || 'Retailer',
          entityAction: 'skip',
          liveLocation: locationData || {
            latitude: 19.076,
            longitude: 72.8777,
            city: 'Mumbai Central',
            address: 'Bandra Retail Corridor',
          },
        }),
      })
      updateUser({
        isOnboarded: true,
        role: selectedRole || user?.role || 'Retailer',
      })
      toast.success('Onboarding skipped. Default configuration loaded.', 'Welcome to SupplyShield AI')
      navigate('/dashboard', { replace: true })
    } catch (e) {
      console.warn('Skip fallback triggered:', e)
      updateUser({ isOnboarded: true })
      navigate('/dashboard', { replace: true })
    } finally {
      setIsLoading(false)
    }
  }

  // Complete onboarding
  const handleCompleteOnboarding = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/v1/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: selectedRole,
          phone: phoneNumber,
          company: companyName,
          liveLocation: locationData || {
            latitude: 19.076,
            longitude: 72.8777,
            city: 'Mumbai Central',
            address: 'Bandra Retail Corridor',
          },
          entityAction: entityChoice,
          entityData: {
            name: newEntityName || (selectedRole.toLowerCase().includes('ware') ? 'Central DC Hub' : 'Fresh Metro Store'),
            category: newEntityCategory,
            capacity: newEntityCapacity,
          },
        }),
      })

      const data = await res.json()
      if (data.success) {
        updateUser({
          isOnboarded: true,
          role: selectedRole,
          phone: phoneNumber,
          company: companyName,
          liveLocation: locationData,
        })
        if (data.createdStore) addStore(data.createdStore)
        if (data.createdWarehouse) addWarehouse(data.createdWarehouse)

        toast.success('Your workspace has been provisioned.', 'Onboarding Completed')
        navigate('/dashboard', { replace: true })
      } else {
        toast.error(data.message || 'Error finalizing onboarding')
        setIsLoading(false)
      }
    } catch (e) {
      console.error('Error finalizing onboarding:', e)
      // Robust fallback so user is never blocked
      updateUser({ isOnboarded: true })
      toast.success('Workspace loaded with default configurations.', 'Welcome to SupplyShield AI')
      navigate('/dashboard', { replace: true })
    }
  }

  // Handle free-text submit from bottom input bar
  const handleSendTextMessage = (text) => {
    const msg = text || textInput
    if (!msg.trim()) return

    setChatHistory((prev) => [...prev, { sender: 'user', text: msg }])
    setTextInput('')

    // Check intent
    const lower = msg.toLowerCase()
    if (lower.includes('why') && lower.includes('location')) {
      setIsLoading(true)
      setTimeout(() => {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: 'ray',
            text: 'Live GPS location allows Google OR-Tools MILP to accurately calculate driving hours, route feasibility, and verify that perishable FEFO inventory will reach your shelves before expiry.',
          },
        ])
        setIsLoading(false)
      }, 700)
      return
    }

    if (step === 1) {
      if (lower.includes('ware') || lower.includes('dc')) setSelectedRole('Warehouse Manager')
      else if (lower.includes('analyst')) setSelectedRole('Supply Chain Analyst')
      else setSelectedRole('Retailer')
      handleAdvanceStep(2)
    } else if (step === 2) {
      setCompanyName(msg)
      handleAdvanceStep(3)
    } else if (step === 3) {
      handleRequestLiveLocation()
    } else if (step === 4) {
      setNewEntityName(msg)
      handleAdvanceStep(5)
    }
  }

  // =========================================================================
  // VIEW 1: INTRO SPLASH (Matching Image 1: Minimalist centered with mint-green symbol & bluish atmosphere)
  // =========================================================================
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50/80 via-blue-50/40 to-slate-50 flex flex-col relative overflow-hidden">
        {/* Always visible top navbar */}
        <OnboardingNavbar user={user} onSkip={handleSkipOnboarding} />

        {/* Soft bluish & emerald ambient radial glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 text-center max-w-md mx-auto">
          {/* Mint-green 4-petal geometric symbol (kept green as requested) */}
          <div className="mb-4 flex flex-col items-center">
            <RaySymbol size={56} className="text-emerald-500 mb-2" />
            <div className="w-20 h-0.5 bg-emerald-400 rounded-full opacity-80" />
          </div>

          {/* Heading in signature mint-emerald */}
          <h1 className="text-3xl sm:text-4xl font-normal text-emerald-600 tracking-tight mb-4">
            Hello! Starting KYC now
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-sm mb-8">
            I'll take care of the onboarding for you. We'll move through a few quick steps together and get everything set up smoothly.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setPhase('chat')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 hover:scale-105 cursor-pointer"
            >
              <span>Begin Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleSkipOnboarding}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-sky-700 transition-colors cursor-pointer"
            >
              Skip to Dashboard →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: RAY AI CONVERSATIONAL WORKSPACE (Bluish theme matching overall theme, green loader)
  // =========================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50/70 via-blue-50/30 to-slate-50 flex flex-col relative text-slate-900 font-sans antialiased">
      {/* Always visible top navbar — no other navlinks, only after dashboard launches */}
      <OnboardingNavbar user={user} onSkip={handleSkipOnboarding} />

      {/* Ambient soft bluish ambient glows */}
      <div className="fixed top-20 right-10 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-sky-100/50 via-blue-50/30 to-transparent pointer-events-none z-0" />

      {/* Main Content Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pt-8 pb-36 relative z-10 flex flex-col">
        {/* Top Header Prompt: RAY Agent Persona Greeting */}
        <div className="mb-7 bg-white/80 backdrop-blur-xs p-5 rounded-2xl border border-sky-100 shadow-sm shadow-sky-900/5">
          <div className="flex items-start gap-3 mb-2">
            <RaySymbol size={26} className="shrink-0 mt-0.5" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              Hello, I'm <span className="font-extrabold text-emerald-600">RAY</span> your AI onboarding agent.
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-9 font-normal">
            I'm here to handle your onboarding so you can get back to building. I'll ask a few quick questions to get you set up. If you're curious about why I need a specific detail or how it helps your business, just ask.
          </p>
        </div>

        {/* Step Progression Content */}
        <div className="space-y-6 flex-1">
          {/* Subheading Prompt */}
          <div className="px-1">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {step === 1 && "Let's verify your operational role to get started"}
              {step === 2 && "Let's link your business identity & mobile alerts"}
              {step === 3 && "Let's calibrate your live GPS location"}
              {step === 4 && (selectedRole.toLowerCase().includes('ware') ? "Let's register or connect your Distribution Center" : "Let's register or connect your Retail Store")}
              {step === 5 && "Your telemetry is verified and ready"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {step === 1 && "Select the primary operational capacity for this account. We'll customize your dashboard telemetry accordingly."}
              {step === 2 && "Enter your company name and mobile number. A real-time dispatch digest will be linked to this identity."}
              {step === 3 && "SupplyShield AI uses deterministic MILP coordinates to calculate dock arrival and road congestion bounds."}
              {step === 4 && "Choose whether to register a brand new facility or request manager access to an existing network facility."}
              {step === 5 && "All constraints, node coordinates, and access permissions have been verified. You're ready to enter the live platform."}
            </p>
          </div>

          {/* Chat History if user has asked questions */}
          {chatHistory.length > 0 && (
            <div className="space-y-3 pt-2">
              {chatHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start items-start gap-2.5'}`}
                >
                  {item.sender === 'ray' && <RaySymbol size={18} className="mt-1 shrink-0" />}
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-lg leading-relaxed shadow-xs ${
                      item.sender === 'user'
                        ? 'bg-sky-600 text-white font-medium rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-sky-100 rounded-tl-xs'
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stepped Rotating Light-Spreading Loader (Kept Green as requested) */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center">
              <RaySymbol size={44} isLoader={true} className="mb-4" />
              <div className="text-xs font-bold text-slate-700">
                RAY is calibrating supply chain telemetry…
              </div>
              <div className="text-[11px] text-sky-600 font-medium mt-0.5">
                Connecting deterministic MILP solvers & updating registry
              </div>
            </div>
          )}

          {/* Interactive Card for Step 1: Role Selection */}
          {!isLoading && step === 1 && (
            <div className="bg-white rounded-2xl border border-sky-100 shadow-md shadow-sky-900/5 p-6 sm:p-7 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-900">Select Operational Capacity</span>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                  ⚡ Instant Preset
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Save time by configuring pre-tuned heuristics specific to your supply chain role.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {[
                  {
                    role: 'Retailer',
                    title: 'FMCG Retailer',
                    icon: Boxes,
                    badge: 'Store Management',
                    desc: 'Store replenishments, shelf fill rates & FEFO stockout prevention.',
                  },
                  {
                    role: 'Warehouse Manager',
                    title: 'DC Controller',
                    icon: Building2,
                    badge: 'Pallets & Docks',
                    desc: 'Regional warehouse stock, dock turnaround & refrigerated lanes.',
                  },
                  {
                    role: 'Supply Chain Analyst',
                    title: 'Ops Analyst',
                    icon: Compass,
                    badge: 'Global Optimizer',
                    desc: 'Disruption simulation, shadow price audits & MILP parameters.',
                  },
                ].map((item) => {
                  const Icon = item.icon
                  const isSelected = selectedRole === item.role
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setSelectedRole(item.role)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-200 shadow-xs'
                          : 'border-slate-200 hover:border-sky-200 hover:bg-sky-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{item.badge}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">{item.title}</div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</p>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleAdvanceStep(2)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  Confirm Role & Continue
                </button>
                <button
                  type="button"
                  onClick={handleSkipOnboarding}
                  className="text-xs font-bold text-slate-400 hover:text-sky-700 transition-colors"
                >
                  Skip for now — use standard retailer profile
                </button>
              </div>
            </div>
          )}

          {/* Interactive Card for Step 2: Contact & Business Identity */}
          {!isLoading && step === 2 && (
            <div className="bg-white rounded-2xl border border-sky-100 shadow-md shadow-sky-900/5 p-6 sm:p-7">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-900">Auto-fill KYC & Profile Details</span>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                  ⚡ Instant
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Save time from uploading docs and details manually. Share your phone number and commercial identity to link live alerts.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Company / Store Trading Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Metro Retail Supermarket Ltd."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Operational Mobile Number (for OTP / Alerts)</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleAdvanceStep(3)}
                    className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all hover:scale-[1.01] cursor-pointer"
                  >
                    Save Profile Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceStep(3)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Step Skip
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSkipOnboarding}
                  className="text-xs font-bold text-slate-400 hover:text-sky-700 transition-colors"
                >
                  Skip for now — continue to dashboard
                </button>
              </div>
            </div>
          )}

          {/* Interactive Card for Step 3: Live GPS Location Permission */}
          {!isLoading && step === 3 && (
            <div className="bg-white rounded-2xl border border-sky-100 shadow-md shadow-sky-900/5 p-6 sm:p-7">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-900">Live GPS Location Telemetry</span>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                  📍 Required for Routing
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                SupplyShield AI relies on exact latitude and longitude to construct transit arcs, check road flooding risks, and calculate physical truck transit hours.
              </p>

              {/* Status Display */}
              {locationData ? (
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 mb-6 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Live GPS Coordinates Verified
                    </div>
                    <div className="font-mono text-xs text-slate-700 mt-1">
                      Lat: {locationData.latitude}°, Lng: {locationData.longitude}°
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {locationData.city || 'Detected Location'} (Accuracy: ±{locationData.accuracy || 10}m)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestLiveLocation}
                    disabled={isLocating}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} /> Re-Scan
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Browser Geolocation Permission</div>
                      <div className="text-[11px] text-slate-500">1-click automated capture of your hub location</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestLiveLocation}
                    disabled={isLocating}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLocating ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Detecting GPS…</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5" />
                        <span>Share Live Location</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleAdvanceStep(4)}
                    className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all hover:scale-[1.01] cursor-pointer"
                  >
                    Continue to Entity Setup
                  </button>
                  {!locationData && (
                    <button
                      type="button"
                      onClick={() => {
                        const fallback = { latitude: 19.076, longitude: 72.8777, accuracy: 50, city: 'Mumbai Central' }
                        setLocationData(fallback)
                        setLiveLocation(fallback)
                        handleAdvanceStep(4)
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800"
                    >
                      Use Regional Default
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSkipOnboarding}
                  className="text-xs font-bold text-slate-400 hover:text-sky-700 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Interactive Card for Step 4: Create Store/DC or Claim Existing */}
          {!isLoading && step === 4 && (
            <div className="bg-white rounded-2xl border border-sky-100 shadow-md shadow-sky-900/5 p-6 sm:p-7">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-900">
                  {selectedRole.toLowerCase().includes('ware') ? 'Distribution Center Node Setup' : 'Retail Store Node Setup'}
                </span>
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                  Node Provisioning
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                You can create your dedicated facility right now, or search and request manager access to an existing facility in the FMCG network.
              </p>

              {/* Toggle Choice */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEntityChoice('create')}
                  className={`py-2 rounded-lg transition-all ${
                    entityChoice === 'create' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create New {selectedRole.toLowerCase().includes('ware') ? 'Warehouse DC' : 'Store'}
                </button>
                <button
                  type="button"
                  onClick={() => setEntityChoice('search')}
                  className={`py-2 rounded-lg transition-all ${
                    entityChoice === 'search' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Search & Claim Existing
                </button>
              </div>

              {/* Sub-View A: Create New Facility */}
              {entityChoice === 'create' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {selectedRole.toLowerCase().includes('ware') ? 'Warehouse / DC Name' : 'Store Name'}
                    </label>
                    <input
                      type="text"
                      value={newEntityName}
                      onChange={(e) => setNewEntityName(e.target.value)}
                      placeholder={selectedRole.toLowerCase().includes('ware') ? 'e.g. Pune Regional Cold Hub' : 'e.g. Fresh Daily Hypermarket #4'}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Classification</label>
                      <select
                        value={newEntityCategory}
                        onChange={(e) => setNewEntityCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white"
                      >
                        {selectedRole.toLowerCase().includes('ware') ? (
                          <>
                            <option value="Regional Distribution Center">Regional Distribution Center</option>
                            <option value="Cold-Chain Depot">Cold-Chain Depot</option>
                            <option value="Transit Hub">Transit Hub</option>
                            <option value="Urban Fulfillment Hub">Urban Fulfillment Hub</option>
                          </>
                        ) : (
                          <>
                            <option value="Supermarket">Supermarket</option>
                            <option value="Hypermarket">Hypermarket</option>
                            <option value="Metro Express">Metro Express</option>
                            <option value="Cold Retail">Cold Retail</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {selectedRole.toLowerCase().includes('ware') ? 'Total Pallets' : 'Max Shelf Capacity (Units)'}
                      </label>
                      <input
                        type="number"
                        value={newEntityCapacity}
                        onChange={(e) => setNewEntityCapacity(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-View B: Search & Request Access */}
              {entityChoice === 'search' && (
                <div className="space-y-4 mb-6">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchNetwork(e.target.value)}
                      placeholder="Search existing stores or warehouses by name or city…"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  {isSearching && (
                    <div className="text-xs text-slate-500 py-3 text-center">Searching registered nodes…</div>
                  )}

                  {searchResults.length > 0 && !selectedEntityForAccess && (
                    <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {searchResults.map((item) => (
                        <div
                          key={item._id}
                          className="p-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{item.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {item.code} · {item.location?.city || 'Regional'} · Managed by {item.owner?.name || 'Administrator'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedEntityForAccess(item)}
                            className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold border border-sky-200"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedEntityForAccess && (
                    <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-sky-900">
                          Requesting Access to: {selectedEntityForAccess.name} ({selectedEntityForAccess.code})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedEntityForAccess(null)}
                          className="text-[11px] text-slate-500 hover:text-slate-800"
                        >
                          Change
                        </button>
                      </div>
                      <input
                        type="text"
                        value={accessReason}
                        onChange={(e) => setAccessReason(e.target.value)}
                        placeholder="Reason for requesting manager access…"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white mb-3"
                      />
                      {!accessRequested ? (
                        <button
                          type="button"
                          onClick={handleSendAccessRequest}
                          className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs"
                        >
                          Submit Access Request to Owner
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Request submitted. The manager can approve from their dashboard.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleAdvanceStep(5)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  Save & Proceed to Review
                </button>
                <button
                  type="button"
                  onClick={handleSkipOnboarding}
                  className="text-xs font-bold text-slate-400 hover:text-sky-700 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Interactive Card for Step 5: Completed */}
          {!isLoading && step === 5 && (
            <div className="bg-white rounded-2xl border border-sky-100 shadow-md shadow-sky-900/5 p-6 sm:p-7">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-900">Telemetry & Credentials Configured</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                All credentials, coordinates, and network bounds have been verified. You can now monitor fill rates, simulate flood disruptions, and view dispatch manifests in real-time.
              </p>

              {/* Summary Pill Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-xs">
                <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Role</span>
                  <span className="font-bold text-slate-900">{selectedRole}</span>
                </div>
                <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Live GPS Coordinates</span>
                  <span className="font-mono font-bold text-sky-700">
                    {locationData ? `${locationData.latitude}°, ${locationData.longitude}°` : 'Default Hub'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Initial Node</span>
                  <span className="font-bold text-slate-900 truncate block">
                    {newEntityName || 'Central Hub'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/25 transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Launch Operational Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSkipOnboarding}
                  className="text-xs font-bold text-slate-400 hover:text-sky-700 transition-colors"
                >
                  Skip and launch now
                </button>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>
      </div>

      {/* Floating Minimalist Input Bar (Styled in bluish palette with green ray accents) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-20">
        <div className="max-w-2xl mx-auto">
          {/* Suggestion Chips */}
          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1 text-[11px] text-slate-600">
            {[
              'Why do you need live GPS?',
              'Can I register multiple stores?',
              'How does FEFO work?',
            ].map((chip, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendTextMessage(chip)}
                className="px-3 py-1 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 font-medium whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer border border-sky-200/60"
              >
                <span>{chip}</span>
                <span className="text-sky-400 text-[10px]">→ Tab</span>
              </button>
            ))}
          </div>

          {/* Minimalist Input Container */}
          <div className="bg-white rounded-2xl border border-sky-200/90 shadow-lg shadow-sky-900/10 p-2.5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRequestLiveLocation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sky-700 hover:bg-sky-50 text-xs font-semibold cursor-pointer shrink-0 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-sky-500" />
              <span>Share live GPS</span>
            </button>

            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSendTextMessage(textInput)
                }
              }}
              placeholder="Ask RAY or enter details manually..."
              className="flex-1 text-xs sm:text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
            />

            <button
              type="button"
              onClick={() => handleSendTextMessage(textInput)}
              className="w-8 h-8 rounded-full bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-center text-slate-400 mt-2 font-normal">
            RAY is AI and can make mistakes. Please check important information
          </p>
        </div>
      </div>
    </div>
  )
}
