import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, TrendingUp, Zap, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../../store/index.js'
import { authAPI } from '../../services/api.js'
import { useToast } from '../../components/ui/Toast.jsx'
import { ToastContainer } from '../../components/ui/Toast.jsx'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const HERO_STATS = [
  { value: '18.4%', label: 'Freight cost reduction' },
  { value: '2.8s', label: 'Network re-plan latency' },
  { value: '76.5%', label: 'Stockout mitigation' },
]

const FEATURES = [
  'OR-Tools MILP optimization engine',
  'Real-time disruption scenario handling',
  'Dynamic FEFO expiry management',
  'Zero phantom inventory guarantee',
]

import { useGoogleAuth } from './useGoogleAuth.js'

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { googleLoading, triggerGoogleAuth } = useGoogleAuth()
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'demo@supplychield.ai', password: 'demo1234' },
  })

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const res = await authAPI.login(data)
      login(res.data.user, res.data.token)
      toast.success('Welcome back! Redirecting to workspace…', 'Signed in')
      navigate(res.data.user?.isOnboarded === false ? '/onboarding' : '/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.'
      toast.error(msg, 'Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    triggerGoogleAuth()
  }

  return (
    <div className="ss-auth-layout">
      {/* Left Hero Panel */}
      <div className="ss-auth-hero">
        {/* Background blobs */}
        <div
          className="ss-geo-blob"
          style={{
            top: '8%',
            right: '-60px',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(36,123,193,0.3) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div
          className="ss-geo-blob"
          style={{
            bottom: '10%',
            left: '-40px',
            width: '220px',
            height: '220px',
            background: 'radial-gradient(circle, rgba(106,176,225,0.2) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div
          className="ss-geo-blob"
          style={{
            top: '45%',
            left: '20%',
            width: '160px',
            height: '160px',
            background: 'radial-gradient(circle, rgba(36,123,193,0.15) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        {/* Content */}
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
              <div
                style={{
                  color: 'rgba(255,255,255,0.45)',
                  fontSize: '12px',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Distribution Intelligence
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1
            style={{
              color: '#ffffff',
              fontSize: '36px',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '16px',
              letterSpacing: '-0.02em',
            }}
          >
            Detect. Replan.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6ab0e1, #a8d1f0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Protect.
            </span>
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: '15px',
              lineHeight: 1.6,
              marginBottom: '40px',
            }}
          >
            From sudden supply-chain disruption to an optimal, explainable recovery plan in under 3 seconds.
          </p>

          {/* Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '40px',
            }}
          >
            {HERO_STATS.map((stat) => (
              <div
                key={stat.value}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '16px 12px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    color: '#6ab0e1',
                    fontWeight: 800,
                    fontSize: '22px',
                    marginBottom: '4px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', lineHeight: 1.4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FEATURES.map((feat) => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={15} color="#208567" style={{ flexShrink: 0 }} />
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '32px',
              justifyContent: 'center',
            }}
          >
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
              <div style={{ fontWeight: 800, fontSize: '18px', color: '#17324d', lineHeight: 1 }}>
                SupplyShield AI
              </div>
              <div style={{ fontSize: '11px', color: '#64778b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Distribution Intelligence
              </div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#17324d',
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
              }}
            >
              Welcome back
            </h2>
            <p style={{ margin: 0, color: '#64778b', fontSize: '14px' }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleLogin}
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
            onMouseEnter={(e) => {
              if (!googleLoading) e.currentTarget.style.borderColor = '#b8d0e8'
              if (!googleLoading) e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,47,80,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d7e6f5'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {googleLoading ? (
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid #d7e6f5',
                  borderTopColor: '#247bc1',
                  borderRadius: '50%',
                  animation: 'spin-slow 0.8s linear infinite',
                }}
              />
            ) : (
              /* Google "G" logo SVG */
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#d7e6f5' }} />
            <span style={{ fontSize: '12px', color: '#99aabb', fontWeight: 500 }}>or sign in with email</span>
            <div style={{ flex: 1, height: '1px', background: '#d7e6f5' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="login-email" className="ss-label">
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="#99aabb"
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  className={`ss-input ${errors.email ? 'ss-input-error' : ''}`}
                  style={{ paddingLeft: '38px' }}
                  placeholder="you@company.com"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="ss-error-text" role="alert">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '8px' }}>
              <label htmlFor="login-password" className="ss-label">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="#99aabb"
                  style={{
                    position: 'absolute',
                    left: '13px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`ss-input ${errors.password ? 'ss-input-error' : ''}`}
                  style={{ paddingLeft: '38px', paddingRight: '42px' }}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#99aabb',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                  }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="ss-error-text" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: '13px',
                  color: '#247bc1',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="ss-btn-primary"
              style={{ width: '100%', padding: '13px 20px', fontSize: '15px' }}
            >
              {isLoading ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin-slow 0.8s linear infinite',
                    }}
                  />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in to dashboard
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p
            style={{
              marginTop: '24px',
              textAlign: 'center',
              fontSize: '14px',
              color: '#64778b',
            }}
          >
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              style={{ color: '#247bc1', fontWeight: 600, textDecoration: 'none' }}
            >
              Create one free
            </Link>
          </p>
        </div>
        <ToastContainer />
      </div>
    </div>
  )
}
