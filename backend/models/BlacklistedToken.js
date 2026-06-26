const mongoose = require('mongoose')

const Schema = mongoose.Schema

const blacklistedTokenSchema = new Schema({
  tokenHash: {
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
}, { timestamps: true })

module.exports = mongoose.model('BlacklistedToken', blacklistedTokenSchema)
