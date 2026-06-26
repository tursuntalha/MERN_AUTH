const express = require('express')
const router = express.Router()
const passport = require('passport')
const User = require('../models/User')
const { generateAccessToken, generateRefreshToken } = require('../utils/tokens')

const GoogleStrategy = require('passport-google-oauth20').Strategy
const GitHubStrategy = require('passport-github2').Strategy

if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/api/oauth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ socialId: profile.id, socialProvider: 'google' })
      if (!user) {
        user = await User.findOne({ email: profile.emails?.[0]?.value })
        if (user) {
          user.socialId = profile.id
          user.socialProvider = 'google'
          if (!user.isEmailVerified) user.isEmailVerified = true
          await user.save()
        } else {
          user = await User.create({
            email: profile.emails?.[0]?.value || `${profile.id}@google-oauth.local`,
            name: profile.displayName,
            password: require('crypto').randomBytes(32).toString('hex'),
            socialId: profile.id,
            socialProvider: 'google',
            isEmailVerified: true,
          })
        }
      }
      done(null, user)
    } catch (err) {
      done(err, null)
    }
  }))
}

if (process.env.GITHUB_CLIENT_ID) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/api/oauth/github/callback`,
    scope: ['user:email'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let email = profile.emails?.[0]?.value || profile.username
      let user = await User.findOne({ socialId: profile.id, socialProvider: 'github' })
      if (!user) {
        user = await User.findOne({ email })
        if (user) {
          user.socialId = profile.id
          user.socialProvider = 'github'
          if (!user.isEmailVerified) user.isEmailVerified = true
          await user.save()
        } else {
          user = await User.create({
            email,
            name: profile.displayName || profile.username,
            password: require('crypto').randomBytes(32).toString('hex'),
            socialId: profile.id,
            socialProvider: 'github',
            isEmailVerified: true,
          })
        }
      }
      done(null, user)
    } catch (err) {
      done(err, null)
    }
  }))
}

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }))

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }), (req, res) => {
  const accessToken = generateAccessToken(req.user._id)
  const refreshToken = generateRefreshToken(req.user._id)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
  })
  res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${accessToken}`)
})

router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }))

router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }), (req, res) => {
  const accessToken = generateAccessToken(req.user._id)
  const refreshToken = generateRefreshToken(req.user._id)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
  })
  res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${accessToken}`)
})

module.exports = router
