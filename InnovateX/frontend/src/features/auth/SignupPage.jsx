import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Building2,
  Zap,
  CheckCircle,
} from 'lucide-react'
import { useAuthStore } from '../../store/index.js'
import { authAPI } from '../../services/api.js'
import { useToast, ToastContainer } from '../../components/ui/Toast.jsx'

const signupSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    company: z.string().optional(),
    role: z.string().min(1, 'Please select your role'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const ROLES = [
  { value: '', label: 'Select your role…' },
  { value: 'Distribution Manager', label: 'Distribution Manager' },
  { value: 'Warehouse Controller', label: 'Warehouse / Batch Controller' },
  { value: 'Supply Chain Analyst', label: 'Supply Chain Analyst' },
  { value: 'Operations Manager', label: 'Operations Manager' },
  { value: 'Other', label: 'Other' },
]

const STEPS = [
  { n: 1, label: 'Account Info' },
  { n: 2, label: 'Set Password' },
]

import { useGoogleAuth } from './useGoogleAuth.js'

export default function SignupPage() {
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { googleLoading, triggerGoogleAuth } = useGoogleAuth()
  const [step, setStep] = useState(1)
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const toast = useToast()

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
  })

  const password = watch('password', '')

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const handleNextStep = async () => {
    const valid = await trigger(['name', 'email', 'role'])
    if (valid) setStep(2)
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const res = await authAPI.signup({
        name: data.name,
        email: data.email,
        company: data.company,
        role: data.role,
        password: data.password,
      })
      login(res.data.user, res.data.token)
      toast.success('Account created! Welcome to SupplyShield AI.', 'Account created')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Sign up failed. Please try again.'
      toast.error(msg, 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    triggerGoogleAuth()
  }

  const passwordStrength = (() => {
    if (!password) return { score: 0, label: '', color: '#d7e6f5' }
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['#d7e6f5', '#d94b50', '#d99a27', '#208567', '#208567']
    return { score, label: labels[score], color: colors[score] }
  })()

  return (
    <div className="ss-auth-layout">
      {/* Left Hero Panel */}
      <div className="ss-auth-hero">
        <div
          className="ss-geo-blob"
          style={{
            top: '5%',
            right: '-80px',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(36,123,193,0.25) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div
          className="ss-geo-blob"
          style={{
            bottom: '5%',
            left: '-60px',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(106,176,225,0.18) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
            <img
              src="/logo.webp"
              alt="SupplyShield AI Logo"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                objectFit: 'contain',
                boxShadow: '0 8px 24px rgba(36,123,193,0.3)',
              }}
            />
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '20px', lineHeight: 1.1 }}>
                SupplyShield AI
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Distribution Intelligence
              </div>
            </div>
          </div>

          <h1
            style={{
              color: '#ffffff',
              fontSize: '34px',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}
          >
            Join the future of{' '}
            <span style={{ background: 'linear-gradient(135deg, #6ab0e1, #a8d1f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              supply chain
            </span>{' '}
            intelligence.
          </h1>

          <p style={{ color: 'rgba(47, 44, 44, 0.65)', fontSize: '15px', lineHeight: 1.6, marginBottom: '40px' }}>
            Set up your organization's distribution command center and start optimizing in minutes.
          </p>

          {/* What you get */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
              What you get
            </div>
            {[
              'Full access to OR-Tools optimization engine',
              'Real-time disruption scenario simulation',
              'FEFO batch expiry management',
              'Interactive network map with risk overlays',
              'AI-grounded decision explanations',
              '20 SKU × 3 warehouse × 12 store demo dataset',
            ].map((feat) => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <CheckCircle size={14} color="#208567" style={{ flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="ss-auth-form-panel">
        <div className="ss-auth-form-container animate-fade-in">
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', justifyContent: 'center' }}>
            <img
              src="/logo.webp"
              alt="SupplyShield AI Logo"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                objectFit: 'contain',
              }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: '#17324d', lineHeight: 1 }}>SupplyShield AI</div>
              <div style={{ fontSize: '11px', color: '#64778b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Distribution Intelligence</div>
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: i < STEPS.length - 1 ? '1' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: step >= s.n ? '#247bc1' : '#d7e6f5',
                      color: step >= s.n ? '#fff' : '#99aabb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      transition: 'all 0.2s',
                    }}
                  >
                    {step > s.n ? <CheckCircle size={14} /> : s.n}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: step >= s.n ? '#247bc1' : '#99aabb', transition: 'color 0.2s' }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: '1px', background: step > s.n ? '#247bc1' : '#d7e6f5', transition: 'background 0.2s' }} />
                )}
              </div>
            ))}
          </div>

          {/* Google OAuth */}
          <button
            id="google-signup-btn"
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '11px 20px',
              background: '#ffffff',
              border: '1.5px solid #d7e6f5',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#17324d',
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              marginBottom: '20px',
              opacity: googleLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (!googleLoading) { e.currentTarget.style.borderColor = '#b8d0e8'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,47,80,0.08)' } }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d7e6f5'; e.currentTarget.style.boxShadow = 'none' }}
          >
            {googleLoading ? (
              <div style={{ width: '18px', height: '18px', border: '2px solid #d7e6f5', borderTopColor: '#247bc1', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" />
              </svg>
            )}
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: '#d7e6f5' }} />
            <span style={{ fontSize: '12px', color: '#99aabb', fontWeight: 500 }}>or sign up with email</span>
            <div style={{ flex: 1, height: '1px', background: '#d7e6f5' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {step === 1 && (
              <div className="animate-fade-in">
                {/* Name */}
                <div style={{ marginBottom: '14px' }}>
                  <label htmlFor="signup-name" className="ss-label">Full name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#99aabb" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="signup-name" type="text" autoComplete="name" className={`ss-input ${errors.name ? 'ss-input-error' : ''}`} style={{ paddingLeft: '38px' }} placeholder="Vikram Malhotra" {...register('name')} />
                  </div>
                  {errors.name && <p className="ss-error-text" role="alert">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div style={{ marginBottom: '14px' }}>
                  <label htmlFor="signup-email" className="ss-label">Email address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#99aabb" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="signup-email" type="email" autoComplete="email" className={`ss-input ${errors.email ? 'ss-input-error' : ''}`} style={{ paddingLeft: '38px' }} placeholder="you@company.com" {...register('email')} />
                  </div>
                  {errors.email && <p className="ss-error-text" role="alert">{errors.email.message}</p>}
                </div>

                {/* Company */}
                <div style={{ marginBottom: '14px' }}>
                  <label htmlFor="signup-company" className="ss-label">Company <span style={{ color: '#99aabb', fontWeight: 400 }}>(optional)</span></label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} color="#99aabb" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="signup-company" type="text" autoComplete="organization" className="ss-input" style={{ paddingLeft: '38px' }} placeholder="Acme Distribution Pvt. Ltd." {...register('company')} />
                  </div>
                </div>

                {/* Role */}
                <div style={{ marginBottom: '24px' }}>
                  <label htmlFor="signup-role" className="ss-label">Your role</label>
                  <select id="signup-role" className={`ss-input ${errors.role ? 'ss-input-error' : ''}`} style={{ appearance: 'none', cursor: 'pointer' }} {...register('role')}>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {errors.role && <p className="ss-error-text" role="alert">{errors.role.message}</p>}
                </div>

                <button
                  type="button"
                  id="signup-next-btn"
                  onClick={handleNextStep}
                  className="ss-btn-primary"
                  style={{ width: '100%', padding: '13px 20px', fontSize: '15px' }}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in">
                {/* Password */}
                <div style={{ marginBottom: '14px' }}>
                  <label htmlFor="signup-password" className="ss-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#99aabb" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="signup-password" type={showPass ? 'text' : 'password'} autoComplete="new-password" className={`ss-input ${errors.password ? 'ss-input-error' : ''}`} style={{ paddingLeft: '38px', paddingRight: '42px' }} placeholder="Min. 8 chars, 1 uppercase, 1 number" {...register('password')} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#99aabb', cursor: 'pointer', padding: '2px', display: 'flex' }} aria-label={showPass ? 'Hide password' : 'Show password'}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="ss-error-text" role="alert">{errors.password.message}</p>}

                  {/* Password strength bar */}
                  {password && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        {[1, 2, 3, 4].map((n) => (
                          <div
                            key={n}
                            style={{
                              flex: 1,
                              height: '3px',
                              borderRadius: '2px',
                              background: n <= passwordStrength.score ? passwordStrength.color : '#d7e6f5',
                              transition: 'background 0.2s',
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', color: passwordStrength.color, fontWeight: 600 }}>
                        {passwordStrength.label}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '24px' }}>
                  <label htmlFor="signup-confirm" className="ss-label">Confirm password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#99aabb" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input id="signup-confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" className={`ss-input ${errors.confirmPassword ? 'ss-input-error' : ''}`} style={{ paddingLeft: '38px', paddingRight: '42px' }} placeholder="Repeat your password" {...register('confirmPassword')} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#99aabb', cursor: 'pointer', padding: '2px', display: 'flex' }} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="ss-error-text" role="alert">{errors.confirmPassword.message}</p>}
                </div>

                {/* Terms */}
                <p style={{ fontSize: '12px', color: '#64778b', marginBottom: '16px', lineHeight: 1.5 }}>
                  By creating an account you agree to our{' '}
                  <a href="#" style={{ color: '#247bc1' }}>Terms of Service</a> and{' '}
                  <a href="#" style={{ color: '#247bc1' }}>Privacy Policy</a>.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="ss-btn-secondary"
                    style={{ flex: 1, padding: '13px' }}
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    id="signup-submit-btn"
                    type="submit"
                    disabled={isLoading}
                    className="ss-btn-primary"
                    style={{ flex: 2, padding: '13px 20px', fontSize: '15px' }}
                  >
                    {isLoading ? (
                      <>
                        <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
                        Creating account…
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Sign in link */}
          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64778b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#247bc1', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>

        <ToastContainer />
      </div>
    </div>
  )
}
