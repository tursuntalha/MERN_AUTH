require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const { apiLimiter } = require('./middleware/rateLimiter')

const connectDB = require('./config/db')

const authRoutes = require('./routes/auth')
const oauthRoutes = require('./routes/oauth')
const adminRoutes = require('./routes/admin')
const mfaRoutes = require('./routes/mfa')

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())
app.use(passport.initialize())

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

app.use('/api/auth', apiLimiter, authRoutes)
app.use('/api/auth/mfa', mfaRoutes)
app.use('/api/oauth', oauthRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

connectDB()

const PORT = process.env.PORT || 4000
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB')
  app.listen(PORT, () => {
    console.log(`AuthForge API running on port ${PORT}`)
  })
})

module.exports = app
