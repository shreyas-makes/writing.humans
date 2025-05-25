import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your_supabase_url_here'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here'

// Log configuration status for debugging
console.log('Supabase Configuration:')
console.log('URL configured:', supabaseUrl !== 'your_supabase_url_here')
console.log('Key configured:', supabaseAnonKey !== 'your_supabase_anon_key_here')

if (supabaseUrl === 'your_supabase_url_here' || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.error('❌ Supabase not configured! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
} else {
  console.log('✅ Supabase configuration loaded')
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('documents').select('count').limit(1)
    if (error) {
      console.error('Supabase connection test failed:', error)
      return { success: false, error: error.message }
    }
    console.log('✅ Supabase connection test successful')
    return { success: true, data }
  } catch (err) {
    console.error('Supabase connection test error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
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