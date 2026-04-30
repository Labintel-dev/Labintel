const { generateAndUploadPDF } = require('../services/pdf');
const fs = require('fs');
const path = require('path');
const supabase = require('../db/supabase');

async function testPdf() {
  const { data: reports } = await supabase.from('reports').select('id').limit(1);
  if (!reports || reports.length === 0) {
    console.log('No reports found');
    return;
  }
  const reportId = reports[0].id;
  console.log('Testing PDF for Report ID:', reportId);

  const signedUrl = await generateAndUploadPDF(reportId);
  console.log('Generated PDF URL:', signedUrl);
}

testPdf().catch(console.error);
