const supabase = require('../db/supabase');

async function checkLabs() {
  const { data: labs } = await supabase.from('labs').select('*');
  console.log(JSON.stringify(labs, null, 2));
}

checkLabs().catch(console.error);
