const { authenticator } = require('otplib')
const QRCode = require('qrcode')
const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
const { generateAccessToken, generateRefreshToken } = require('../utils/tokens')

const setupMfa = async (req, res) => {
  try {
    const secret = authenticator.generateSecret()
    const otpauth = authenticator.keyuri(req.user.email, 'AuthForge', secret)

    req.user.mfaSecret = secret
    await req.user.save({ validateBeforeSave: false })

    const qrCode = await QRCode.toDataURL(otpauth)

    res.json({ secret, qrCode, message: 'Scan the QR code with Google Authenticator or Authy.' })
  } catch (error) {
    console.error('MFA setup error:', error)
    res.status(500).json({ error: 'Server error during MFA setup.' })
  }
}

const verifyMfaSetup = async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ error: 'Verification code is required.' })
    }

    if (!req.user.mfaSecret) {
      return res.status(400).json({ error: 'MFA not initialized. Call setup first.' })
    }

    const isValid = authenticator.verify({ token, secret: req.user.mfaSecret })
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code.' })
    }

    req.user.mfaEnabled = true
    req.user.mfaMethod = 'totp'
    await req.user.save({ validateBeforeSave: false })

    await AuditLog.create({
      user: req.user._id,
      action: 'mfa_setup',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    })

    res.json({ message: 'MFA enabled successfully.' })
  } catch (error) {
    console.error('MFA verify setup error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

const verifyMfaLogin = async (req, res) => {
  try {
    const { token, mfaToken } = req.body
    if (!token || !mfaToken) {
      return res.status(400).json({ error: 'Verification code and MFA token are required.' })
    }

    let decoded
    try {
      const jwt = require('jsonwebtoken')
      decoded = jwt.verify(mfaToken, process.env.JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired MFA token.' })
    }

    const user = await User.findById(decoded.userId)
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return res.status(401).json({ error: 'MFA not configured for this user.' })
    }

    const isValid = authenticator.verify({ token, secret: user.mfaSecret })
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid MFA code.' })
    }

    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    const { setRefreshCookie } = require('./authController')
    setRefreshCookie(res, refreshToken)

    await AuditLog.create({
      user: user._id,
      action: 'mfa_verify',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    })

    res.json({
      user: { id: user._id, email: user.email, name: user.name, role: user.role, isEmailVerified: user.isEmailVerified },
      accessToken,
    })
  } catch (error) {
    console.error('MFA login error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

const disableMfa = async (req, res) => {
  try {
    req.user.mfaEnabled = false
    req.user.mfaMethod = 'none'
    req.user.mfaSecret = undefined
    await req.user.save({ validateBeforeSave: false })

    res.json({ message: 'MFA disabled.' })
  } catch (error) {
    console.error('Disable MFA error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

module.exports = { setupMfa, verifyMfaSetup, verifyMfaLogin, disableMfa }
