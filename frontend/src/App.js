import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import MFASetup from './pages/MFASetup'
import MFAChallenge from './pages/MFAChallenge'
import AdminPanel from './pages/AdminPanel'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import './App.css'

function App() {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }

  return (
    <BrowserRouter>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          <Route path="/mfa/setup" element={isAuthenticated ? <MFASetup /> : <Navigate to="/login" />} />
          <Route path="/mfa/challenge" element={<MFAChallenge />} />
          <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

function OAuthCallback() {
  const { setUser } = useAuth()
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')

  if (token) {
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        setUser(data.user, token)
        window.location.href = '/'
      })
  }

  return <div>Completing login...</div>
}

export default App
