import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../context/I18nContext'
import { getBrokerStatus } from '../api/mqtt'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { setting, setTheme } = useTheme()
  const { lang, setLang, t, availableLangs } = useI18n()
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
    <Link to={to} style={{
      padding: '6px 14px',
      borderRadius: 6,
      background: location.pathname.startsWith(to) ? 'rgba(79,142,247,0.15)' : 'transparent',
      color: location.pathname.startsWith(to) ? 'var(--accent)' : 'var(--text-muted)',
      fontWeight: location.pathname.startsWith(to) ? 600 : 400,
      fontSize: '0.93rem',
      transition: 'all 0.15s',
    }}>
      {label}
    </Link>
  )

  const themeOptions = [
    { value: 'dark',  icon: '🌙', label: t.theme.dark },
    { value: 'light', icon: '☀️', label: t.theme.light },
    { value: 'auto',  icon: '💻', label: t.theme.auto },
  ]

  return (
    <nav style={{
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      height: 58,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Left: brand + nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent)', letterSpacing: 1 }}>
          {t.appName}
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          {navLink('/messages', t.nav.messages)}
          {navLink('/subscriptions', t.nav.subscriptions)}
          {isAdmin() && navLink('/admin', t.nav.admin)}
        </div>
      </div>

      {/* Right: broker status + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Broker dot */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
            background: connected === true ? 'var(--success)' : connected === false ? 'var(--danger)' : 'var(--text-muted)',
          }} />
          {connected === true ? t.broker.connected : connected === false ? t.broker.offline : t.broker.checking}
        </span>

        {/* Language selector */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          title="Language / Sprache / Jazyk"
          style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          {availableLangs.map((l) => (
            <option key={l} value={l}>{t.lang[l]}</option>
          ))}
        </select>

        {/* Theme toggle buttons */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg3)', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              title={opt.label}
              style={{
                padding: '3px 8px',
                fontSize: '0.78rem',
                background: setting === opt.value ? 'var(--accent)' : 'transparent',
                color: setting === opt.value ? '#fff' : 'var(--text-muted)',
                borderRadius: 4,
                border: 'none',
              }}
            >
              {opt.icon}
            </button>
          ))}
        </div>

        {/* User */}
        <span style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
          {user?.username}
          {isAdmin() && <span className="badge badge-blue" style={{ marginLeft: 6 }}>ADMIN</span>}
        </span>
        <button className="btn-secondary btn-sm" onClick={logout}>{t.auth.logout}</button>
      </div>
    </nav>
  )
}
