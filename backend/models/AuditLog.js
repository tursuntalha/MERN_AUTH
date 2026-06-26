const mongoose = require('mongoose')

const Schema = mongoose.Schema

const auditLogSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
    enum: [
      'register',
      'login',
      'logout',
      'refresh_token',
      'email_verify',
      'password_reset',
      'mfa_setup',
      'mfa_verify',
      'social_login',
      'session_revoke',
      'admin_action',
    ],
  },
  ip: String,
  userAgent: String,
  metadata: Schema.Types.Mixed,
  success: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true })

module.exports = mongoose.model('AuditLog', auditLogSchema)
