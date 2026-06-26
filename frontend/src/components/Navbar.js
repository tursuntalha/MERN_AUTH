import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <nav className="navbar">
      <Link to="/"><h1>AuthForge</h1></Link>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <span>{user?.email}</span>
            {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
            <Link to="/mfa/setup">MFA</Link>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
