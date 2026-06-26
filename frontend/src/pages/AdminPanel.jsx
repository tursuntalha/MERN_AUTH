import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

const AdminPanel = () => {
  const { axiosInstance } = useAuth()
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [tab, setTab] = useState('users')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (tab === 'users') fetchUsers()
    else fetchLogs()
  }, [tab])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/api/admin/users')
      setUsers(res.data.users)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/api/admin/audit')
      setLogs(res.data.logs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const revokeSessions = async (userId) => {
    try {
      await axiosInstance.delete(`/api/admin/sessions/${userId}`)
      setMessage('Sessions revoked.')
    } catch (err) {
      setMessage('Error revoking sessions.')
    }
  }

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      {message && <div className="success">{message}</div>}
      <div style={{ marginBottom: '1rem' }}>
        <button className={`btn ${tab === 'users' ? '' : 'btn-outline'}`} style={{ width: 'auto', marginRight: '0.5rem' }} onClick={() => setTab('users')}>Users</button>
        <button className={`btn ${tab === 'logs' ? '' : 'btn-outline'}`} style={{ width: 'auto' }} onClick={() => setTab('logs')}>Audit Log</button>
      </div>

      {tab === 'users' && (
        <div className="card">
          {loading ? <p>Loading...</p> : (
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>MFA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>{u.email}</td>
                    <td>{u.name || '-'}</td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td>{u.isEmailVerified ? '✓' : '✗'}</td>
                    <td>{u.mfaEnabled ? '✓' : '✗'}</td>
                    <td><button className="btn btn-danger" style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => revokeSessions(u._id)}>Revoke Sessions</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div className="card">
          {loading ? <p>Loading...</p> : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>IP</th>
                  <th>Success</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td>{log.user?.email || 'N/A'}</td>
                    <td>{log.action}</td>
                    <td>{log.ip}</td>
                    <td>{log.success ? '✓' : '✗'}</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminPanel
