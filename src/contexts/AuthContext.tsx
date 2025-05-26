import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// HMR-persistent state setup
const HMR_AUTH_CONTEXT_STATE_KEY = 'blueScribeAuthContextHMRState_v1'
let hmrPersistentState = import.meta.hot?.data[HMR_AUTH_CONTEXT_STATE_KEY]
if (!hmrPersistentState) {
  hmrPersistentState = { initializedLogically: false }
  console.log('[AuthContext-HMR] Initializing new persistent state.')
} else {
  console.log('[AuthContext-HMR] Reusing persistent state:', hmrPersistentState)
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log('[AuthContext-HMR] Saving persistent state before dispose:', hmrPersistentState)
    import.meta.hot.data[HMR_AUTH_CONTEXT_STATE_KEY] = hmrPersistentState
  })
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  const mountedRef = useRef(true)
  const subscriptionRef = useRef<any>(null)

  const handleAuthStateChange = useCallback(async (event: string, currentSession: Session | null) => {
    if (!mountedRef.current) return

    console.log(`🔄 Auth state change: ${event}`, { user: currentSession?.user?.email || 'No user', initialized: hmrPersistentState.initializedLogically })
    
    setSession(currentSession)
    setUser(currentSession?.user ?? null)
    setLoading(false)

    if (event === 'INITIAL_SESSION' && !hmrPersistentState.initializedLogically) {
      console.log('✅ Processing INITIAL_SESSION for the first time (HMR-aware).')
      hmrPersistentState.initializedLogically = true
    } else if (event === 'INITIAL_SESSION' && hmrPersistentState.initializedLogically) {
      console.log('ℹ️ Processing INITIAL_SESSION (already HMR-initialized). UI state updated.')
    }

    if (event === 'SIGNED_IN') {
      console.log('✅ User signed in successfully:', currentSession?.user?.email)
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      })
    } else if (event === 'SIGNED_OUT') {
      console.log('👋 User signed out')
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
    } else if (event === 'TOKEN_REFRESHED') {
      console.log('🔄 Token refreshed for:', currentSession?.user?.email)
    }
  }, [toast])

  useEffect(() => {
    mountedRef.current = true
    console.log('[AuthProvider useEffect] Running. HMR initialized state:', hmrPersistentState.initializedLogically)
    setLoading(true)

    const getInitialSession = async () => {
      try {
        console.log('[AuthProvider getInitialSession] Fetching session...')
        const { data: { session: initialSessionData }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('❌ Error getting session:', error)
        }
        if (mountedRef.current) {
          console.log('[AuthProvider getInitialSession] Fetched, passing to handleAuthStateChange.', initialSessionData?.user?.email || 'No user')
          await handleAuthStateChange('INITIAL_SESSION', initialSessionData)
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession catch block:', error)
        if (mountedRef.current) setLoading(false)
      }
    }

    getInitialSession()

    if (subscriptionRef.current) {
      console.log('[AuthProvider useEffect] Unsubscribing existing listener before new one.')
      subscriptionRef.current.unsubscribe()
    }
    
    console.log('[AuthProvider useEffect] Subscribing to onAuthStateChange.')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => handleAuthStateChange(event, session)
    )
    subscriptionRef.current = subscription

    return () => {
      mountedRef.current = false
      if (subscriptionRef.current) {
        console.log('[AuthProvider useEffect Cleanup] Unsubscribing auth state listener.')
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [handleAuthStateChange])

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        })
      } else if (data.user && !data.session) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        })
      }
      
      return { error }
    } catch (error) {
      console.error('Sign up error:', error)
      return { error }
    }
  }, [toast])

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log('🔐 Attempting sign in for:', email)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        console.error('❌ Sign in failed:', error.message)
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        })
        if (mountedRef.current) setLoading(false)
      } else {
        console.log('✅ Sign in call successful, waiting for auth state change...')
      }
      return { error }
    } catch (error) {
      console.error('❌ Sign in error (catch block):', error)
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      if (mountedRef.current) setLoading(false)
      return { error: error instanceof Error ? error : new Error(String(error)) }
    }
  }, [toast])

  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        })
        if (mountedRef.current) setLoading(false)
      }
    } catch (error) {
      console.error('Sign out error:', error)
      if (mountedRef.current) setLoading(false)
    }
  }, [toast])

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      
      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        })
      }
      
      return { error }
    } catch (error) {
      console.error('Password reset error:', error)
      return { error }
    }
  }, [toast])

  const value = React.useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }), [user, session, loading, signUp, signIn, signOut, resetPassword])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 