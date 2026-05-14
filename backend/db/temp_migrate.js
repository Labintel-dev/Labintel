'use strict';
require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const sql = `
    ALTER TABLE patients ALTER COLUMN phone DROP NOT NULL;
    ALTER TABLE patients ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
    
    -- Drop the constraint if it exists to make script rerunnable
    ALTER TABLE patients DROP CONSTRAINT IF EXISTS check_phone_or_email;
    ALTER TABLE patients ADD CONSTRAINT check_phone_or_email CHECK (phone IS NOT NULL OR email IS NOT NULL);
  `;
  try {
    await client.query(sql);
    console.log('✅ Migration applied successfully via PG client.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}
run();
