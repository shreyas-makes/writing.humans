import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { FileText, Loader2 } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Use refs to prevent unnecessary re-renders during HMR
  const mountedRef = useRef(true)
  const hasNavigatedRef = useRef(false)

  const from = location.state?.from?.pathname || '/'

  // Debug logging with throttling to prevent spam
  const lastLogRef = useRef(0)
  useEffect(() => {
    const now = Date.now()
    if (now - lastLogRef.current > 1000) { // Log at most once per second
      console.log('🔍 Login component state:', {
        email: email ? 'provided' : 'empty',
        password: password ? 'provided' : 'empty',
        loading,
        authLoading,
        user: user ? user.email : 'null',
        from,
        hasNavigated: hasNavigatedRef.current
      })
      lastLogRef.current = now
    }
  }, [email, password, loading, authLoading, user, from])

  // Redirect if already authenticated - with protection against multiple navigations
  useEffect(() => {
    if (!mountedRef.current || hasNavigatedRef.current) return
    
    if (!authLoading && user) {
      console.log('🚀 User authenticated, navigating to:', from)
      hasNavigatedRef.current = true
      navigate(from, { replace: true })
    }
  }, [user, authLoading, navigate, from])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleLogin = async () => {
    if (loading || !email || !password || !mountedRef.current) return
    
    console.log('🚀 Login attempt started for:', email)
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      
      if (!mountedRef.current) return // Component unmounted
      
      if (error) {
        console.error('❌ Login failed:', error)
        setLoading(false)
      } else {
        console.log('✅ Login successful, waiting for auth state update...')
        // Keep loading true until auth state changes or timeout
        setTimeout(() => {
          if (mountedRef.current && !hasNavigatedRef.current) {
            console.log('⚠️ Login timeout, resetting loading state')
            setLoading(false)
          }
        }, 5000) // 5 second timeout
      }
    } catch (err) {
      console.error('💥 Login error:', err)
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && email && password) {
      e.preventDefault()
      handleLogin()
    }
  }

  // Reset loading when user changes (successful login)
  useEffect(() => {
    if (user && loading) {
      console.log('✅ User authenticated, resetting login loading state')
      setLoading(false)
    }
  }, [user, loading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
{/* Debug Info - Remove this in production 
        {process.env.NODE_ENV === 'development' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-800">Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-yellow-700">
              <div>Auth Loading: {authLoading ? 'true' : 'false'}</div>
              <div>User: {user ? user.email : 'null'}</div>
              <div>Form Loading: {loading ? 'true' : 'false'}</div>
              <div>Email: {email ? 'provided' : 'empty'}</div>
              <div>Password: {password ? 'provided' : 'empty'}</div>
              <div>Has Navigated: {hasNavigatedRef.current ? 'true' : 'false'}</div>
            </CardContent>
          </Card>
        )} */}

        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <FileText className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your email and password to access your documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your email"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>

              <Button
                type="button"
                onClick={handleLogin}
                className="w-full"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login 