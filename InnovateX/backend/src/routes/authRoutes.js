const express = require('express')
const router = express.Router()
const {
  signup,
  login,
  googleAuth,
  googleExchangeCode,
  googleRedirect,
  googleCallback,
  getMe,
} = require('../controllers/authController')
const { protect } = require('../middleware/auth')

// Email/password auth
router.post('/signup', signup)
router.post('/login', login)

// Google OAuth (frontend sends ID token or access token)
router.post('/google', googleAuth)

// Google OAuth code exchange (frontend sends code received from redirect)
router.post('/google/code', googleExchangeCode)

// Server-side Google OAuth redirect flow
router.get('/google/redirect', googleRedirect)
router.get('/google/callback', googleCallback)

// Protected user profile
router.get('/me', protect, getMe)

module.exports = router
