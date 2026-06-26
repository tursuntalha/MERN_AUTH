import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { API_URL } = useAuth()

  const token = searchParams.get('token')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Reset failed')
        return
      }

      setMessage('Password reset successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-form">
        <h2>Invalid Reset Link</h2>
        <p>This link is invalid or has expired. Please request a new password reset.</p>
        <Link to="/forgot-password" className="link">Request new reset link</Link>
      </div>
    )
  }

  return (
    <div className="auth-form">
      <h2>Reset Password</h2>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>New Password (min 8 characters)</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
      </form>
    </div>
  )
}

export default ResetPassword
