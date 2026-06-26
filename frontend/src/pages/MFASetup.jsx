import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

const MFASetup = () => {
  const { axiosInstance, user } = useAuth()
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [step, setStep] = useState('idle')

  useEffect(() => {
    if (user?.mfaEnabled) {
      setStep('enabled')
    }
  }, [user])

  const handleSetup = async () => {
    setError('')
    try {
      const res = await axiosInstance.post('/api/auth/mfa/setup')
      setQrCode(res.data.qrCode)
      setSecret(res.data.secret)
      setStep('verify')
    } catch (err) {
      setError(err.response?.data?.error || 'Setup failed')
    }
  }

  const handleVerify = async () => {
    setError('')
    try {
      const res = await axiosInstance.post('/api/auth/mfa/verify', { token })
      setMessage(res.data.message)
      setStep('done')
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed')
    }
  }

  const handleDisable = async () => {
    setError('')
    try {
      await axiosInstance.post('/api/auth/mfa/disable')
      setStep('idle')
      setMessage('MFA disabled.')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disable MFA')
    }
  }

  if (step === 'enabled') {
    return (
      <div className="mfa-setup">
        <h2>Two-Factor Authentication</h2>
        <div className="card">
          <p>MFA is currently enabled on your account.</p>
          <button className="btn btn-danger mt-1" onClick={handleDisable}>Disable MFA</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mfa-setup">
      <h2>Set Up Two-Factor Authentication</h2>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}

      {step === 'idle' && (
        <div className="card">
          <p>Enhance your account security with time-based one-time passwords (TOTP) using Google Authenticator or Authy.</p>
          <button className="btn mt-1" onClick={handleSetup}>Set Up MFA</button>
        </div>
      )}

      {step === 'verify' && (
        <div className="card">
          <p>Scan this QR code with your authenticator app:</p>
          {qrCode && <img src={qrCode} alt="QR Code" />}
          <p className="secret">Secret: {secret}</p>
          <p>Then enter the 6-digit code from your app:</p>
          <div className="form-group">
            <input type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="000000" maxLength={6} />
          </div>
          <button className="btn" onClick={handleVerify}>Verify & Enable</button>
        </div>
      )}

      {step === 'done' && (
        <div className="card">
          <p>MFA has been enabled successfully!</p>
          <p>From now on, you'll need a code from your authenticator app to log in.</p>
        </div>
      )}
    </div>
  )
}

export default MFASetup
