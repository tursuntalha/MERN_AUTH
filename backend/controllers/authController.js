const crypto = require('crypto')
const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
const BlacklistedToken = require('../models/BlacklistedToken')
const redis = require('../config/redis')
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokens')
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email')

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' })
    }

    const user = await User.create({ email: email.toLowerCase(), password, name })

    const verificationToken = user.generateEmailVerificationToken()
    await user.save({ validateBeforeSave: false })

    try {
      await sendVerificationEmail(user.email, verificationToken)
    } catch (emailErr) {
      console.error('Verification email failed:', emailErr.message)
    }

    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    await AuditLog.create({
      user: user._id,
      action: 'register',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    })

    setRefreshCookie(res, refreshToken)

    res.status(201).json({
      user: { id: user._id, email: user.email, name: user.name, role: user.role, isEmailVerified: user.isEmailVerified },
      accessToken,
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Server error during registration.' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    if (user.isLocked()) {
      return res.status(423).json({ error: 'Account locked. Try again in 15 minutes.' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      await user.incrementLoginAttempts()
      await AuditLog.create({
        user: user._id,
        action: 'login',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        success: false,
        metadata: { reason: 'invalid_password' },
      })
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } })

    if (user.mfaEnabled) {
      const mfaToken = generateAccessToken(user._id)
      return res.json({ requireMfa: true, mfaToken, user: { email: user.email, mfaMethod: user.mfaMethod } })
    }

    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    await AuditLog.create({
      user: user._id,
      action: 'login',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    })

    setRefreshCookie(res, refreshToken)

    res.json({
      user: { id: user._id, email: user.email, name: user.name, role: user.role, isEmailVerified: user.isEmailVerified },
      accessToken,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Server error during login.' })
  }
}

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken
    if (refreshToken) {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex')
      await BlacklistedToken.create({ tokenHash: hash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
      try {
        await redis.setex(`bl_${hash}`, 7 * 24 * 60 * 60, '1')
      } catch (redisErr) {
        console.error('Redis blacklist error:', redisErr.message)
      }
    }

    if (req.user) {
      await AuditLog.create({
        user: req.user._id,
        action: 'logout',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      })
    }

    res.clearCookie('refreshToken', cookieOptions())
    res.json({ message: 'Logged out successfully.' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Server error during logout.' })
  }
}

const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) {
      return res.status(401).json({ error: 'No refresh token provided.' })
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex')

    const blacklisted = await BlacklistedToken.findOne({ tokenHash: hash })
    if (blacklisted) {
      res.clearCookie('refreshToken', cookieOptions())
      return res.status(401).json({ error: 'Refresh token has been revoked.' })
    }

    try {
      const redisBlacklisted = await redis.get(`bl_${hash}`)
      if (redisBlacklisted) {
        res.clearCookie('refreshToken', cookieOptions())
        return res.status(401).json({ error: 'Refresh token has been revoked.' })
      }
    } catch (redisErr) {
      console.error('Redis check error:', redisErr.message)
    }

    let decoded
    try {
      decoded = verifyRefreshToken(token)
    } catch (err) {
      await BlacklistedToken.create({ tokenHash: hash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
      res.clearCookie('refreshToken', cookieOptions())
      return res.status(401).json({ error: 'Invalid or expired refresh token.' })
    }

    await BlacklistedToken.create({ tokenHash: hash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
    try {
      await redis.setex(`bl_${hash}`, 7 * 24 * 60 * 60, '1')
    } catch (redisErr) {
      console.error('Redis blacklist error:', redisErr.message)
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({ error: 'User not found.' })
    }

    const newAccessToken = generateAccessToken(user._id)
    const newRefreshToken = generateRefreshToken(user._id)

    await AuditLog.create({
      user: user._id,
      action: 'refresh_token',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    })

    setRefreshCookie(res, newRefreshToken)

    res.json({ accessToken: newAccessToken })
  } catch (error) {
    console.error('Refresh error:', error)
    res.status(500).json({ error: 'Server error during token refresh.' })
  }
}

const getMe = async (req, res) => {
  res.json({ user: req.user })
}

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' })
    }

    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save({ validateBeforeSave: false })

    await AuditLog.create({
      user: user._id,
      action: 'email_verify',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    })

    res.json({ message: 'Email verified successfully.' })
  } catch (error) {
    console.error('Verify email error:', error)
    res.status(500).json({ error: 'Server error during email verification.' })
  }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.json({ message: 'If that email is registered, a password reset link has been sent.' })
    }

    const resetToken = user.generatePasswordResetToken()
    await user.save({ validateBeforeSave: false })

    try {
      await sendPasswordResetEmail(user.email, resetToken)
    } catch (emailErr) {
      console.error('Password reset email failed:', emailErr.message)
    }

    res.json({ message: 'If that email is registered, a password reset link has been sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' })
    }

    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    await AuditLog.create({
      user: user._id,
      action: 'password_reset',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    })

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Server error during password reset.' })
  }
}

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, cookieOptions())
}

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
})

module.exports = { register, login, logout, refresh, getMe, verifyEmail, forgotPassword, resetPassword }
