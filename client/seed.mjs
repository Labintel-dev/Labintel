import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kweqebpommjzcxhalnqg.supabase.co'
const supabaseKey = 'sb_publishable_qs5U2f052znwa988fQRRpw_p2KPmZhZ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log("Attempting to insert a test patient record into 'patient' table...")
  
  // Create a random UUID to avoid conflicts
  const testId = crypto.randomUUID()
  
  const { data, error } = await supabase.from('patient').insert([{
    id: testId,
    email: 'testuser' + Math.floor(Math.random() * 1000) + '@example.com',
    phone: '555-0199',
    dob: '1990-01-01',
    full_name: 'Test Setup User',
    role: 'patient'
  }]).select()

  if (error) {
    console.error('Failed to insert test data. Error:', JSON.stringify(error, null, 2))
  } else {
    console.log('Successfully inserted test data! Result:', data)
  }
}
seed()
