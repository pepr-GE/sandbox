import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getBrokerStatus } from '../api/mqtt'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const [connected, setConnected] = useState(null)

  useEffect(() => {
    const check = () =>
      getBrokerStatus()
        .then((r) => setConnected(r.data.connected))
        .catch(() => setConnected(false))
    check()
    const id = setInterval(check, 10000)
    return () => clearInterval(id)
  }, [])

  const navLink = (to, label) => (
    <Link
      to={to}
      style={{
        padding: '6px 14px',
        borderRadius: 6,
        background: location.pathname.startsWith(to) ? 'rgba(79,142,247,0.15)' : 'transparent',
        color: location.pathname.startsWith(to) ? 'var(--accent)' : 'var(--text-muted)',
        fontWeight: location.pathname.startsWith(to) ? 600 : 400,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </Link>
  )

  return (
    <nav style={{
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--accent)' }}>
          MQTT Core
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {navLink('/messages', 'Messages')}
          {navLink('/subscriptions', 'Subscriptions')}
          {isAdmin() && navLink('/admin', 'Admin')}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected === true ? 'var(--success)' : connected === false ? 'var(--danger)' : 'var(--text-muted)',
            display: 'inline-block',
          }} />
          <span style={{ color: 'var(--text-muted)' }}>
            {connected === true ? 'Broker connected' : connected === false ? 'Broker offline' : 'Checking...'}
          </span>
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {user?.username}
          {isAdmin() && <span className="badge badge-blue" style={{ marginLeft: 6 }}>ADMIN</span>}
        </span>
        <button className="btn-secondary btn-sm" onClick={logout}>Logout</button>
      </div>
    </nav>
  )
}
