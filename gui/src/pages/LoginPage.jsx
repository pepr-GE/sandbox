import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginSuccess } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(username, password)
      loginSuccess(res.data)
      navigate('/messages', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || t.auth.invalidCreds)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="card" style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 6, letterSpacing: 2 }}>
            {t.appName}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.93rem' }}>
            {t.auth.signIn}
          </div>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t.auth.username}</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
          </div>
          <div className="form-group">
            <label>{t.auth.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '11px' }} disabled={loading}>
            {loading ? t.auth.signingIn : t.auth.signInBtn}
          </button>
        </form>
      </div>
    </div>
  )
}
