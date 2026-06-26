const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')
const crypto = require('crypto')

const Schema = mongoose.Schema

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  name: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  mfaSecret: String,
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
  mfaMethod: {
    type: String,
    enum: ['totp', 'none'],
    default: 'none',
  },
  socialId: String,
  socialProvider: String,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now()
}

userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    })
  }
  const updates = { $inc: { loginAttempts: 1 } }
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }
  }
  return this.updateOne(updates)
}

userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex')
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex')
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000
  return token
}

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex')
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000
  return token
}

module.exports = mongoose.model('User', userSchema)
