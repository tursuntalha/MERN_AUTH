import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const MFAChallenge = () => {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, API_URL } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const mfaToken = sessionStorage.getItem('mfaToken')
    if (!mfaToken) {
      navigate('/login')
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/mfa/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, mfaToken }),
        credentials: 'include',
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid code')
        return
      }

      sessionStorage.removeItem('mfaToken')
      setUser(data.user, data.accessToken)
      navigate('/')
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-form">
      <h2>Two-Factor Authentication</h2>
      <p className="mb-1">Enter the 6-digit code from your authenticator app.</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="000000" maxLength={6} required />
        </div>
        <button type="submit" className="btn" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
      </form>
    </div>
  )
}

export default MFAChallenge
