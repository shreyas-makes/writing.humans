import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = 'https://krxjgtumxjfbcurglmbf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeGpndHVteGpmYmN1cmdsbWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDI4NDgsImV4cCI6MjA2MzY3ODg0OH0.Q98fee6dKvZ1RefK3qrrwIbTWQTiRQNh5DQ1wBBUeAw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthAndDocument() {
  try {
    console.log('Testing authentication and document creation...')
    
    const testEmail = 'testuser@gmail.com'
    const testPassword = 'testpassword123'
    const testId = '91ed3421-326d-4c05-bb58-33e1746f1d1e'
    
    // Step 1: Try to sign up a test user
    console.log('\n1. Attempting to sign up test user...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })
    
    if (signUpError) {
      console.log('❌ Sign up failed (might already exist):', signUpError.message)
      
      // Try to sign in instead
      console.log('\n2. Attempting to sign in...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      
      if (signInError) {
        console.error('❌ Sign in failed:', signInError.message)
        return
      } else {
        console.log('✅ Signed in successfully')
        console.log('User ID:', signInData.user.id)
      }
    } else {
      console.log('✅ Sign up successful')
      if (signUpData.user && !signUpData.session) {
        console.log('📧 Email confirmation required')
        return
      }
      console.log('User ID:', signUpData.user.id)
    }
    
    // Step 3: Check current session
    console.log('\n3. Checking current session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
      return
    }
    
    if (!session) {
      console.error('❌ No active session')
      return
    }
    
    console.log('✅ Active session found')
    console.log('User ID:', session.user.id)
    console.log('User email:', session.user.email)
    
    // Step 4: Try to create a document
    console.log('\n4. Attempting to create document...')
    const { data, error } = await supabase
      .from('documents')
      .upsert({
        id: testId,
        title: 'Test Document',
        content: '<p>This is a test document created via API</p>',
        user_id: session.user.id,
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Document creation failed:', error.message)
      console.error('Error details:', error)
    } else {
      console.log('✅ Document created successfully:', data)
    }
    
    // Step 5: Try to read the document
    console.log('\n5. Attempting to read document...')
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

testAuthAndDocument().then(() => {
  console.log('\n' + '='.repeat(50))
  console.log('Test completed')
  console.log('='.repeat(50))
}) 