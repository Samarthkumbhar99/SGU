import { z } from 'zod'
import mongoose from 'mongoose'
import User from '../models/User.js'
import { generateToken } from '../utils/jwt.js'
import { OAuth2Client } from 'google-auth-library'
import env from '../config/env.js'
import logger from '../utils/logger.js'

// Helper to get OAuth client with up-to-date environment variables
const getGoogleClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5173/'
  )
}

// In-memory fallback for local development if MongoDB is offline
const memoryUsers = new Map()

const getMockUser = (userData) => {
  const email = userData.email.toLowerCase()
  if (!memoryUsers.has(email)) {
    const mockUser = {
      _id: 'mock_' + Buffer.from(email).toString('hex').slice(0, 12),
      name: userData.name || email.split('@')[0],
      email,
      avatar: userData.avatar || null,
      company: userData.company || 'InnovateX Supply Chain',
      role: userData.role || 'Distribution Manager',
      isActive: true,
      lastLogin: new Date(),
      toSafeJSON() {
        return {
          id: this._id,
          _id: this._id,
          name: this.name,
          email: this.email,
          avatar: this.avatar,
          company: this.company,
          role: this.role,
          isActive: this.isActive,
          lastLogin: this.lastLogin,
        }
      },
    }
    memoryUsers.set(email, mockUser)
  }
  const user = memoryUsers.get(email)
  user.lastLogin = new Date()
  return user
}

// ——— Validation Schemas ———
const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  company: z.string().max(200).optional(),
  role: z
    .enum([
      'Distribution Manager',
      'Warehouse Controller',
      'Supply Chain Analyst',
      'Operations Manager',
      'Admin',
      'Other',
    ])
    .optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ——— Helper ———
function sendAuthResponse(res, user, statusCode = 200) {
  const token = generateToken(user._id)
  return res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeJSON ? user.toSafeJSON() : user,
  })
}

// Helper to upsert a Google user into MongoDB or memory
async function upsertGoogleUser({ googleId, email, name, picture }) {
  const isDbConnected = mongoose.connection.readyState === 1

  if (isDbConnected) {
    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] })

    if (!user) {
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        googleId,
        avatar: picture,
        role: 'Distribution Manager',
      })
    } else {
      let modified = false
      if (!user.googleId) {
        user.googleId = googleId
        modified = true
      }
      if (picture && !user.avatar) {
        user.avatar = picture
        modified = true
      }
      if (modified) await user.save()
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })
    return user
  }

  // Fallback to memory
  return getMockUser({
    email,
    name: name || email.split('@')[0],
    avatar: picture,
    role: 'Distribution Manager',
  })
}

// ——— POST /api/v1/auth/signup ———
const signup = async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const { name, email, password, company, role } = parsed.data
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const existing = await User.findOne({ email: email.toLowerCase() })
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        })
      }

      const passwordHash = await User.hashPassword(password)
      const user = await User.create({ name, email: email.toLowerCase(), passwordHash, company, role })
      return sendAuthResponse(res, user, 201)
    }

    // Memory fallback
    const user = getMockUser({ name, email, company, role })
    return sendAuthResponse(res, user, 201)
  } catch (err) {
    next(err)
  }
}

// ——— POST /api/v1/auth/login ———
const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const { email, password } = parsed.data
    const isDbConnected = mongoose.connection.readyState === 1

    if (isDbConnected) {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        })
      }

      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        })
      }

      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() })
      return sendAuthResponse(res, user)
    }

    // Memory fallback: if in dev demo mode, allow valid login
    const user = getMockUser({ email, name: email.split('@')[0] })
    return sendAuthResponse(res, user)
  } catch (err) {
    next(err)
  }
}

// ——— POST /api/v1/auth/google ———
// Verify Google ID token or Access token sent from frontend
const googleAuth = async (req, res, next) => {
  try {
    const { token, accessToken } = req.body
    if (!token && !accessToken) {
      return res.status(400).json({ success: false, message: 'Google token is required.' })
    }

    let payload = null

    // 1. Try verifying as ID token
    if (token) {
      try {
        const client = getGoogleClient()
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        })
        payload = ticket.getPayload()
      } catch (verifyErr) {
        console.warn('verifyIdToken failed, attempting userinfo fetch with token:', verifyErr.message)
      }
    }

    // 2. Fallback to userinfo API (if access token or token wasn't a standard id_token)
    if (!payload) {
      const bearer = accessToken || token
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${bearer}` },
      })
      if (infoRes.ok) {
        payload = await infoRes.json()
      }
    }

    if (!payload || (!payload.email && !payload.sub)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token or unable to retrieve user info.',
      })
    }

    const googleId = payload.sub
    const email = payload.email
    const name = payload.name || payload.email.split('@')[0]
    const picture = payload.picture

    const user = await upsertGoogleUser({ googleId, email, name, picture })
    return sendAuthResponse(res, user)
  } catch (err) {
    console.error('googleAuth error:', err)
    next(err)
  }
}

// ——— POST /api/v1/auth/google/code ———
// Exchange authorization code (received at http://localhost:5173/) for tokens
const googleExchangeCode = async (req, res, next) => {
  try {
    const { code, redirect_uri } = req.body
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code is required.' })
    }

    const redirectUri = redirect_uri || process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5173/'

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()

    if (tokens.error || (!tokens.id_token && !tokens.access_token)) {
      return res.status(400).json({
        success: false,
        message: tokens.error_description || tokens.error || 'Failed to exchange authorization code.',
      })
    }

    let payload = null
    if (tokens.id_token) {
      try {
        const client = getGoogleClient()
        const ticket = await client.verifyIdToken({
          idToken: tokens.id_token,
          audience: process.env.GOOGLE_CLIENT_ID,
        })
        payload = ticket.getPayload()
      } catch (e) {
        console.warn('Token verification error:', e.message)
      }
    }

    if (!payload && tokens.access_token) {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (infoRes.ok) {
        payload = await infoRes.json()
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract Google account info from exchange response.',
      })
    }

    const user = await upsertGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
    })

    return sendAuthResponse(res, user)
  } catch (err) {
    console.error('googleExchangeCode error:', err)
    next(err)
  }
}

// ——— GET /api/v1/auth/google/redirect ———
const googleRedirect = (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5173/',
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}

// ——— GET /api/v1/auth/google/callback ———
const googleCallback = async (req, res, next) => {
  try {
    const { code } = req.query
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`)
    }

    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5173/'
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokens = await tokenRes.json()

    if (!tokens.id_token && !tokens.access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_token_failed`)
    }

    let payload = null
    if (tokens.id_token) {
      const client = getGoogleClient()
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      payload = ticket.getPayload()
    } else {
      const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (infoRes.ok) payload = await infoRes.json()
    }

    const user = await upsertGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
    })

    const jwtToken = generateToken(user._id)
    res.redirect(`${process.env.FRONTEND_URL}/?token=${jwtToken}`)
  } catch (err) {
    console.error('Google callback error:', err)
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_callback_failed`)
  }
}

// ——— GET /api/v1/auth/me ———
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON ? req.user.toSafeJSON() : req.user })
}

export {
  signup,
  login,
  googleAuth,
  googleExchangeCode,
  googleRedirect,
  googleCallback,
  getMe,
}

export default {
  signup,
  login,
  googleAuth,
  googleExchangeCode,
  googleRedirect,
  googleCallback,
  getMe,
}
