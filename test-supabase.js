import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = 'https://krxjgtumxjfbcurglmbf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGpndHVteGpmYmN1cmdsbWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDI4NDgsImV4cCI6MjA2MzY3ODg0OH0.Q98fee6dKvZ1RefK3qrrwIbTWQTiRQNh5DQ1wBBUeAw'

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...')
    const { data, error } = await supabase.from('documents').select('count')
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      console.error('Error details:', error)
      return false
    }
    
    console.log('✅ Basic connection successful')
    
    console.log('\n2. Testing authentication status...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message)
    } else {
      console.log('Session status:', session ? 'Authenticated' : 'Not authenticated')
      if (session) {
        console.log('User ID:', session.user.id)
        console.log('User email:', session.user.email)
      }
    }
    
    console.log('\n3. Testing document query (should work for authenticated users)...')
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .limit(5)
    
    if (docsError) {
      console.error('❌ Document query failed:', docsError.message)
      console.error('This is expected if not authenticated due to RLS policies')
    } else {
      console.log('✅ Document query successful')
      console.log('Found', docs.length, 'documents')
    }
    
    return true
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return false
  }
}

testConnection().then(success => {
  console.log('\n' + '='.repeat(50))
  console.log(success ? '✅ Test completed' : '❌ Test failed')
  console.log('='.repeat(50))
}) 