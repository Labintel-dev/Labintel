require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkDatabase() {
  console.log('--- Database Check ---');
  
  // 1. Check Labs
  const { data: labs, error: labErr } = await supabase.from('labs').select('id, name, slug');
  console.log(`Labs count: ${labs?.length || 0}`);
  if (labErr) console.error('Lab Error:', labErr);
  
  // 2. Check Staff
  const { data: staff, error: staffErr } = await supabase.from('lab_staff').select('id, full_name, role, email');
  console.log(`Staff count: ${staff?.length || 0}`);
  if (staffErr) console.error('Staff Error:', staffErr);

  // 3. Check Reports
  const { data: reports, error: repErr } = await supabase.from('reports').select('id, status, created_at, lab_id');
  console.log(`Total Reports: ${reports?.length || 0}`);
  
  const inReview = reports?.filter(r => r.status === 'in_review') || [];
  console.log(`Reports awaiting release (in_review): ${inReview.length}`);
  
  // 4. Check Alerts
  const { data: alerts } = await supabase.from('health_alerts').select('id, is_read');
  console.log(`Total Alerts: ${alerts?.length || 0}`);
  console.log(`Unread Alerts: ${alerts?.filter(a => !a.is_read).length || 0}`);
  
  // 5. Test Manager Dashboard Endpoint simulation
  console.log('\n--- Simulating Manager Dashboard Data Fetch ---');
  if (labs && labs.length > 0) {
    const testLabId = labs[0].id;
    console.log(`Using lab: ${labs[0].name} (${testLabId})`);
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // Reports this month
    const { count: reportsThisMonth } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('lab_id', testLabId)
      .gte('created_at', startOfMonth);
    
    console.log(`Reports this month (from DB): ${reportsThisMonth}`);
  }
}

checkDatabase().catch(console.error);
