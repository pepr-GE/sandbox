import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(setting) {
  if (setting === 'auto') return getSystemTheme()
  return setting
}

export function ThemeProvider({ children }) {
  const [setting, setSetting] = useState(() => localStorage.getItem('app_theme') || 'dark')

  const apply = (s) => {
    const resolved = resolveTheme(s)
    document.documentElement.setAttribute('data-theme', resolved)
  }

  useEffect(() => {
    apply(setting)
    if (setting === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => apply('auto')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [setting])

  const setTheme = (s) => {
    localStorage.setItem('app_theme', s)
    setSetting(s)
    apply(s)
  }

  return (
    <ThemeContext.Provider value={{ setting, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
