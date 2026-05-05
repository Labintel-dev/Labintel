const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows: rlsStatus } = await client.query("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('patients', 'reports', 'labs', 'test_panels')");
    console.log('RLS Status:', rlsStatus);

    const { rows: policies } = await client.query("SELECT * FROM pg_policies WHERE tablename IN ('patients', 'reports')");
    console.log('Policies:', JSON.stringify(policies, null, 2));
  } finally {
    await client.end();
  }
}
run();
