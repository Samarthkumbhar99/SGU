import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api.js'
import { useAuthStore, toast } from '../../store/index.js'

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '138705545583-7d2p5bom6jenaqjqqtqqgubp3amuvo4q.apps.googleusercontent.com'

export function useGoogleAuth() {
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    // Initialize Google Identity Services (One-Tap / GSI ID token)
    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              if (!response?.credential) return
              setGoogleLoading(true)
              try {
                const res = await authAPI.googleAuth(response.credential)
                login(res.data.user, res.data.token)
                toast.success(`Welcome, ${res.data.user.name || 'User'}!`, 'Signed in with Google')
                navigate('/dashboard')
              } catch (err) {
                const msg = err.response?.data?.message || 'Google sign-in failed.'
                toast.error(msg, 'Google Auth Error')
              } finally {
                setGoogleLoading(false)
              }
            },
            auto_select: false,
          })
        } catch (e) {
          console.warn('GSI init failed:', e)
        }
      }
    }

    initGsi()
    const timer = setTimeout(initGsi, 800)
    return () => clearTimeout(timer)
  }, [login, navigate])

  const triggerGoogleAuth = () => {
    setGoogleLoading(true)

    // 1. Modern GIS Popup: Token Client
    if (window.google?.accounts?.oauth2?.initTokenClient) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setGoogleLoading(false)
              if (tokenResponse.error !== 'popup_closed_by_user') {
                toast.error(tokenResponse.error_description || tokenResponse.error, 'Google Auth Failed')
              }
              return
            }
            try {
              const res = await authAPI.googleAuth(null, tokenResponse.access_token)
              login(res.data.user, res.data.token)
              toast.success(`Welcome, ${res.data.user.name || 'User'}!`, 'Signed in with Google')
              navigate('/dashboard')
            } catch (err) {
              const msg = err.response?.data?.message || 'Failed to authenticate with backend.'
              toast.error(msg, 'Auth Error')
            } finally {
              setGoogleLoading(false)
            }
          },
        })
        tokenClient.requestAccessToken({ prompt: 'select_account' })
        return
      } catch (err) {
        console.warn('Token client failed, falling back:', err)
      }
    }

    // 2. Try GSI One-Tap Prompt
    if (window.google?.accounts?.id?.prompt) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // 3. Fallback direct OAuth redirect
          const redirectUri = window.location.origin + '/'
          window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
            redirectUri
          )}&response_type=code&scope=openid%20email%20profile&prompt=select_account`
        }
      })
      return
    }

    // 3. Fallback direct OAuth redirect
    const redirectUri = window.location.origin + '/'
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=openid%20email%20profile&prompt=select_account`
  }

  return { googleLoading, triggerGoogleAuth }
}
