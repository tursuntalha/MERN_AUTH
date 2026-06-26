const express = require('express')
const router = express.Router()
const { requireAuth } = require('../middleware/authMiddleware')
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter')
const {
  register, login, logout, refresh, getMe,
  verifyEmail, forgotPassword, resetPassword,
} = require('../controllers/authController')
const { verifyMfaLogin } = require('../controllers/mfaController')

router.post('/register', registerLimiter, register)
router.post('/login', loginLimiter, login)
router.post('/logout', requireAuth, logout)
router.post('/refresh', refresh)
router.get('/me', requireAuth, getMe)
router.get('/verify-email', verifyEmail)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/mfa/login', verifyMfaLogin)

module.exports = router
