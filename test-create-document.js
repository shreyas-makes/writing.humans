import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = 'https://krxjgtumxjfbcurglmbf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGpndHVteGpmYmN1cmdsbWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDI4NDgsImV4cCI6MjA2MzY3ODg0OH0.Q98fee6dKvZ1RefK3qrrwIbTWQTiRQNh5DQ1wBBUeAw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCreateDocument() {
  try {
    console.log('Testing document creation with specific ID...')
    
    const testId = '91ed3421-326d-4c05-bb58-33e1746f1d1e'
    
    // First, try to create a test user session (this won't work with anon key, but let's see the error)
    console.log('\n1. Checking current session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
    } else {
      console.log('Session status:', session ? 'Authenticated' : 'Not authenticated')
    }
    
    // Try to create a document (this should fail due to RLS if not authenticated)
    console.log('\n2. Attempting to create document...')
    const { data, error } = await supabase
      .from('documents')
      .upsert({
        id: testId,
        title: 'Test Document',
        content: '<p>Test content</p>',
        user_id: session?.user?.id || null,
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Document creation failed:', error.message)
      console.error('Error details:', error)
      
      if (error.code === '42501') {
        console.log('💡 This is expected - RLS policy requires authentication')
      }
    } else {
      console.log('✅ Document created successfully:', data)
    }
    
    // Try to read the document
    console.log('\n3. Attempting to read document...')
    const { data: readData, error: readError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', testId)
      .single()
    
    if (readError) {
      console.error('❌ Document read failed:', readError.message)
      console.error('Error details:', readError)
    } else {
      console.log('✅ Document read successfully:', readData)
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testCreateDocument().then(() => {
  console.log('\n' + '='.repeat(50))
  console.log('Test completed')
  console.log('='.repeat(50))
}) 