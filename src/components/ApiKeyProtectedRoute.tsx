import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useUserSettings } from '@/hooks/useUserSettings'
import { Loader2 } from 'lucide-react'

interface ApiKeyProtectedRouteProps {
  children: React.ReactNode
}

const ApiKeyProtectedRoute: React.FC<ApiKeyProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const { settings, isLoading: settingsLoading } = useUserSettings()
  const location = useLocation()

  // Show loading while checking auth and settings
  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to landing page
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // If authenticated but no API key, redirect to settings
  // Allow access to settings page itself to avoid infinite redirect
  if (!settings.openai_api_key && location.pathname !== '/settings') {
    return <Navigate to="/settings" state={{ from: location, requiresApiKey: true }} replace />
  }

  return <>{children}</>
}

export default ApiKeyProtectedRoute 