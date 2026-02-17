import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="spinner" />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !user?.roles?.includes('ROLE_ADMIN')) {
    return <Navigate to="/messages" replace />
  }

  return children
}
