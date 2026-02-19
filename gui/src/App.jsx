import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { I18nProvider } from './context/I18nContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import MessagesPage from './pages/MessagesPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import AdminPage from './pages/AdminPage'

function Layout({ children }) {
  return (
    <div>
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/messages" element={<ProtectedRoute><Layout><MessagesPage /></Layout></ProtectedRoute>} />
              <Route path="/subscriptions" element={<ProtectedRoute><Layout><SubscriptionsPage /></Layout></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Layout><AdminPage /></Layout></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/messages" replace />} />
              <Route path="*" element={<Navigate to="/messages" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  )
}
