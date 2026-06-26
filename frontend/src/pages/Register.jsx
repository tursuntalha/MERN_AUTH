import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, API_URL } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setSuccess('Account created! Check your email to verify your address.')
      setUser(data.user, data.accessToken)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-form">
      <h2>Create Account</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password (min 8 characters)</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
        </div>
        <button type="submit" className="btn" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</button>
      </form>
      <div className="text-center mt-1">
        Already have an account? <Link to="/login" className="link">Sign in</Link>
      </div>
    </div>
  )
}

export default Register
