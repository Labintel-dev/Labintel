const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkData() {
  const { data: reports, error: rError } = await supabase.from('reports').select('*');
  const { data: users, error: uError } = await supabase.from('patient').select('*');

  console.log('--- Reports ---');
  console.log(JSON.stringify(reports, null, 2));
  console.log('--- Users ---');
  console.log(JSON.stringify(users, null, 2));
}

checkData();
