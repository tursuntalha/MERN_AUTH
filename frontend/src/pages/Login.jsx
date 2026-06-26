import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, API_URL } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      if (data.requireMfa) {
        sessionStorage.setItem('mfaToken', data.mfaToken)
        window.location.href = '/mfa/challenge'
        return
      }

      setUser(data.user, data.accessToken)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-form">
      <h2>Sign In</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
      <div className="text-center mt-1">
        <Link to="/forgot-password" className="link">Forgot password?</Link>
      </div>
      <div className="text-center mt-1">
        Don't have an account? <Link to="/register" className="link">Sign up</Link>
      </div>
      <div className="social-login">
        <p>Or continue with</p>
        <div className="social-buttons">
          <a href={`${API_URL}/api/oauth/google`} className="social-btn google">Google</a>
          <a href={`${API_URL}/api/oauth/github`} className="social-btn github">GitHub</a>
        </div>
      </div>
    </div>
  )
}

export default Login
