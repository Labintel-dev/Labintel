const supabase = require('../db/supabase');

async function checkReports() {
  const { data: reports } = await supabase
    .from('reports')
    .select('id, test_values(count)')
    .limit(20);

  reports.forEach(r => {
    console.log(`Report ${r.id}: ${r.test_values?.[0]?.count || 0} values`);
  });
}

checkReports().catch(console.error);
