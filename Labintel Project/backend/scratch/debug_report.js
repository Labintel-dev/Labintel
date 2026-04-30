const supabase = require('../db/supabase');

async function debugReport() {
  const { data: reports } = await supabase.from('reports').select('id').limit(1);
  if (!reports || reports.length === 0) {
    console.log('No reports found');
    return;
  }
  const reportId = reports[0].id;
  console.log('Debugging Report ID:', reportId);

  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select(`
      id, lab_id, collected_at, reported_at, status, share_token,
      created_at, patient_id,
      labs!reports_lab_id_fkey (
        name, address, phone, logo_url, primary_color, slug
      ),
      patients!reports_patient_id_fkey (
        full_name, date_of_birth, gender, phone
      ),
      test_panels!reports_panel_id_fkey (
        name, short_code
      ),
      lab_staff!reports_created_by_fkey (
        full_name
      ),
      test_values (
        value, flag,
        test_parameters (
          name, unit, ref_min_male, ref_max_male, ref_min_female, ref_max_female, sort_order
        )
      ),
      report_insights (
        summary, findings, recommendation
      )
    `)
    .eq('id', reportId)
    .single();

  if (reportError) {
    console.error('Report Error:', reportError);
    return;
  }

  console.log('Report Data Keys:', Object.keys(report));
  console.log('Test Values Count:', report.test_values?.length);
  if (report.test_values?.length > 0) {
    console.log('First Test Value:', JSON.stringify(report.test_values[0], null, 2));
  } else {
    console.log('WARNING: No test values found for this report');
  }
  
  console.log('Report Insights:', JSON.stringify(report.report_insights, null, 2));
}

debugReport().catch(console.error);
