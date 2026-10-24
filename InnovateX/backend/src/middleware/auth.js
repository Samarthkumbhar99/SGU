const { verifyToken } = require('../utils/jwt')
const User = require('../models/User')

// Protect routes — require valid JWT
const protect = async (req, res, next) => {
  try {
    let token

    // 1. Bearer token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }
    // 2. Fallback: HttpOnly cookie
    else if (req.cookies?.token) {
      token = req.cookies.token
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      })
    }

    const decoded = verifyToken(token)
    const user = await User.findById(decoded.sub).select('-passwordHash -googleId')

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account deactivated.',
      })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' })
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' })
  }
}

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      })
    }
    next()
  }
}

module.exports = { protect, restrictTo }
