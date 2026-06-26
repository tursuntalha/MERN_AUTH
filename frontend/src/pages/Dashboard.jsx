import { useAuth } from '../hooks/useAuth'

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.name || user?.email}</h1>
      <div className="card">
        <h3>Account Details</h3>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Email Verified:</strong> {user?.isEmailVerified ? '✓ Yes' : '✗ No'}</p>
        <p><strong>User ID:</strong> {user?.id}</p>
      </div>
    </div>
  )
}

export default Dashboard
