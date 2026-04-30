const supabase = require('../db/supabase');

async function checkReportDates() {
  const { data: reports } = await supabase
    .from('reports')
    .select('id, status, created_at, collected_at, reported_at, pdf_url')
    .eq('status', 'released')
    .limit(5);

  reports.forEach(r => {
    console.log(`Report ${r.id}:`);
    console.log(`  Status: ${r.status}`);
    console.log(`  Created At: ${r.created_at}`);
    console.log(`  Reported At: ${r.reported_at}`);
    console.log(`  PDF URL: ${r.pdf_url ? 'Yes' : 'No'}`);
  });
}

checkReportDates().catch(console.error);
