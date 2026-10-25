import jwt from 'jsonwebtoken'
import env from '../config/env.js'

export const generateToken = (userId) => {
  return jwt.sign(
    { sub: userId, iat: Math.floor(Date.now() / 1000) },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN || '7d' }
  )
}

export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET)
}

export default { generateToken, verifyToken }
