const jwt = require('jsonwebtoken')
const User = require('../models/User')

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password -mfaSecret -emailVerificationToken -passwordResetToken')
    if (!user) {
      return res.status(401).json({ error: 'User not found.' })
    }
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ error: 'Invalid token.' })
  }
}

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password -mfaSecret')
    if (user) req.user = user
  } catch (error) {
    // silently fail
  }
  next()
}

module.exports = { requireAuth, optionalAuth }
