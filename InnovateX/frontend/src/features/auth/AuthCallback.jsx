import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI } from '../../services/api.js'
import { useAuthStore, toast } from '../../store/index.js'
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token')
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setError(`Google authentication cancelled or failed: ${errorParam}`)
        toast.error('Google authentication failed', 'Auth Error')
        setTimeout(() => navigate('/login'), 2500)
        return
      }

      if (token) {
        // Direct JWT passed in query
        try {
          localStorage.setItem('supplyshield_token', token)
          const meRes = await authAPI.me()
          login(meRes.data.user, token)
          toast.success(`Welcome back, ${meRes.data.user.name}!`, 'Signed in')
          navigate('/dashboard', { replace: true })
        } catch {
          // If me fails, still log in with decoded or fallback
          login({ name: 'Google User', email: 'user@supplyshield.ai', role: 'Distribution Manager' }, token)
          toast.success('Signed in with Google', 'Success')
          navigate('/dashboard', { replace: true })
        }
        return
      }

      if (code) {
        // Exchange authorization code
        try {
          const redirectUri = window.location.origin + '/'
          const res = await authAPI.googleExchangeCode(code, redirectUri)
          login(res.data.user, res.data.token)
          toast.success(`Welcome, ${res.data.user.name || 'User'}!`, 'Google Sign-in Successful')
          navigate('/dashboard', { replace: true })
        } catch (err) {
          const msg = err.response?.data?.message || 'Failed to exchange Google authorization code.'
          setError(msg)
          toast.error(msg, 'Google Sign-in Error')
          setTimeout(() => navigate('/login'), 3000)
        }
        return
      }

      // No tokens found
      navigate('/login', { replace: true })
    }

    handleAuth()
  }, [searchParams, navigate, login])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a192f',
        color: '#e2e8f0',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          background: 'rgba(16, 42, 77, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '16px',
          padding: '40px 48px',
          maxWidth: '460px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
      >
        {error ? (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: '#f87171' }}>
              Authentication Failed
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
              {error}
            </p>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Redirecting you to login…</p>
          </div>
        ) : (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(37, 99, 235, 0.15)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: '#f1f5f9' }}>
              Authenticating with Google…
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.5 }}>
              Securing session and loading your supply chain workspace.
            </p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
