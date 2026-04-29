import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kweqebpommjzcxhalnqg.supabase.co'
const supabaseKey = 'sb_publishable_qs5U2f052znwa988fQRRpw_p2KPmZhZ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  const { data, error } = await supabase.from('reports').select('*').limit(1)
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Columns in reports table:', Object.keys(data[0] || {}))
  }
}
checkSchema()
