'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

async function verify() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // 1. Table columns
  const cols = await client.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'staff_attendance' ORDER BY ordinal_position"
  );
  console.log('\n📋  staff_attendance columns:');
  cols.rows.forEach(r => console.log(`     ${r.column_name.padEnd(20)} ${r.data_type}`));

  // 2. Unique constraint
  const uniq = await client.query(
    "SELECT conname FROM pg_constraint WHERE conname = 'staff_attendance_staff_date_unique'"
  );
  console.log('\n🔒  Unique constraint:', uniq.rows.length > 0 ? '✅ exists' : '❌ MISSING');

  // 3. RLS policies
  const policies = await client.query(
    "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'staff_attendance'"
  );
  console.log('\n🛡   RLS policies:');
  policies.rows.forEach(r => console.log(`     [${r.cmd}] ${r.policyname}`));

  // 4. Indexes
  const idxs = await client.query(
    "SELECT indexname FROM pg_indexes WHERE tablename = 'staff_attendance'"
  );
  console.log('\n⚡  Indexes:');
  idxs.rows.forEach(r => console.log(`     ${r.indexname}`));

  await client.end();
  console.log('\n✅  Verification complete\n');
}

verify().catch(err => { console.error('❌ ', err.message); process.exit(1); });
