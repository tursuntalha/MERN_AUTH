const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"AuthForge" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  }
  return transporter.sendMail(mailOptions)
}

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`
  return sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">Verify Email</a>
      <p>This link expires in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `,
  })
}

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`
  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  })
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendEmail }
