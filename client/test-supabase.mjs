import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kweqebpommjzcxhalnqg.supabase.co'
const supabaseKey = 'sb_publishable_qs5U2f052znwa988fQRRpw_p2KPmZhZ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Checking Supabase connection...")
  const { data, error } = await supabase.from('patient').select('*').limit(1)
  if (error) {
    console.error('Error connecting or RLS issue:', error)
  } else {
    console.log('Supabase connection successful! Query succeeded, data:', data)
  }
}
test()
