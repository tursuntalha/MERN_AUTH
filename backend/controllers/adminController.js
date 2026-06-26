const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
const BlacklistedToken = require('../models/BlacklistedToken')

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query
    const query = {}
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ]
    }

    const users = await User.find(query)
      .select('-password -mfaSecret -emailVerificationToken -passwordResetToken -emailVerificationExpires -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    const total = await User.countDocuments(query)

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

const revokeSessions = async (req, res) => {
  try {
    const { userId } = req.params
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found.' })
    }

    user.loginAttempts = 0
    user.lockUntil = undefined
    await user.save({ validateBeforeSave: false })

    await AuditLog.create({
      user: req.user._id,
      action: 'session_revoke',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
      metadata: { targetUser: userId },
    })

    res.json({ message: 'All sessions revoked for user. They will need to log in again.' })
  } catch (error) {
    console.error('Revoke sessions error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action } = req.query
    const query = {}
    if (userId) query.user = userId
    if (action) query.action = action

    const logs = await AuditLog.find(query)
      .populate('user', 'email name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    const total = await AuditLog.countDocuments(query)

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Get audit logs error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

module.exports = { getUsers, revokeSessions, getAuditLogs }
