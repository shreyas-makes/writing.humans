import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your_supabase_url_here'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here'

// Log configuration status for debugging
console.log('🔧 Supabase Configuration:')
console.log('URL configured:', supabaseUrl !== 'your_supabase_url_here')
console.log('Key configured:', supabaseAnonKey !== 'your_supabase_anon_key_here')

if (supabaseUrl === 'your_supabase_url_here' || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.error('❌ Supabase not configured! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  console.error('📝 Create a .env file in your project root with:')
  console.error('VITE_SUPABASE_URL=your_supabase_project_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key')
} else {
  console.log('✅ Supabase configuration loaded')
}

// Create and export the Supabase client with better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'blue-scribe-suggest'
    }
  }
})

// Test connection function with better error handling
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...')
    const { data, error } = await supabase.from('documents').select('count').limit(1)
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message)
      return { success: false, error: error.message }
    }
    console.log('✅ Supabase connection test successful')
    return { success: true, data }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('💥 Supabase connection test error:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

// Database types for TypeScript
export interface Document {
  id: string
  title: string
  content: string
  user_id: string | null
  created_at: string
  updated_at: string
}

// Auth event types for better debugging
export const logAuthEvent = (event: string, session: any) => {
  const timestamp = new Date().toISOString()
  console.log(`🔐 [${timestamp}] Auth Event: ${event}`, {
    user: session?.user?.email || 'No user',
    hasSession: !!session,
    expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
  })
} 