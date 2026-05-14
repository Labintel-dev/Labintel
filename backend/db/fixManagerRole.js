'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixManagerRole() {
  console.log('\n🔧  Fixing manager role in database...\n');

  try {
    // Execute the ALTER TYPE command to add manager to enum
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'manager';`
    }).catch(() => null);

    if (error) {
      console.error('⚠️  RPC approach failed, trying direct approach...');
    } else if (data) {
      console.log('✅  Manager role added to enum via RPC');
      return true;
    }

    // Alternative: Use raw query through Supabase
    console.log('📝  Attempting direct enum update...');
    // Note: This requires service role and may need custom SQL function
    console.log(`
To fix manager role manually via Supabase SQL editor:

1. Go to Supabase Dashboard → SQL Editor
2. Run this command:

DO $$ BEGIN
  ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'manager';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

3. Then run: npm run seed
    `);

    return false;
  } catch (err) {
    console.error('❌  Error:', err.message);
    return false;
  }
}

fixManagerRole().catch(console.error);
