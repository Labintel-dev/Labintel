require('dotenv').config({ path: __dirname + '/.env' });
const { generateAndUploadPDF } = require('./services/pdf');
const supabase = require('./db/supabase');

async function test() {
  console.log("Fetching a report ID...");
  const { data, error } = await supabase.from('reports').select('id').limit(1);
  if (error || !data || data.length === 0) {
    console.error("No report found or error:", error);
    process.exit(1);
  }
  const reportId = data[0].id;
  console.log("Testing with report ID:", reportId);
  try {
    const url = await generateAndUploadPDF(reportId);
    console.log("Success! PDF URL:", url);
  } catch (err) {
    console.error("Test script caught error:", err);
  }
  process.exit(0);
}

test();
