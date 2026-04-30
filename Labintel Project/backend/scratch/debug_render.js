const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const supabase = require('../db/supabase');
const { generateAndUploadPDF } = require('../services/pdf');

async function debugRender() {
  const { data: reports } = await supabase.from('reports').select('id').limit(1);
  if (!reports || reports.length === 0) {
    console.log('No reports found');
    return;
  }
  const reportId = reports[0].id;
  console.log('Testing PDF for Report ID:', reportId);

  // Re-run the generation to trigger the debug HTML save (if we add it back)
  // But wait, I'll just write a custom script to grab the HTML directly from the same logic
  
  // Actually, I can just modify pdf.js temporarily to save a screenshot of the page right before page.pdf()
}

debugRender().catch(console.error);
