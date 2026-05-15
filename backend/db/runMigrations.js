'use strict';
/**
 * Migration runner — applies SQL migrations via Supabase's Management REST API.
 * Works from any external network without requiring direct Postgres access.
 *
 * Usage: node db/runMigrations.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const fs    = require('fs');
const path  = require('path');

const projectRef = process.env.SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '');
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!projectRef || !serviceKey) {
  console.error('❌  SUPABASE_URL or SUPABASE_SERVICE_KEY missing in .env');
  process.exit(1);
}

async function executeSQL(sql, filename) {
  const response = await axios.post(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    { query: sql },
    {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type':  'application/json',
      },
      timeout: 30000,
    }
  );
  return response.data;
}

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`\n🚀  Project: ${projectRef}`);
  console.log(`⏳  Running ${files.length} migrations via Supabase Management API...\n`);

  for (const file of files) {
    console.log(`⏳  ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    try {
      await executeSQL(sql, file);
      console.log(`✅  ${file}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;

      // Non-fatal errors (objects already exist)
      if (
        msg?.includes('already exists') ||
        msg?.includes('duplicate_object') ||
        msg?.includes('duplicate key')
      ) {
        console.log(`✅  ${file} (already applied)`);
        continue;
      }

      console.error(`❌  ${file}: ${msg}`);
      console.error('    Stopping. Fix the error and re-run.');
      process.exit(1);
    }
  }

  console.log('\n🎉  All migrations applied successfully!');
}

runMigrations();
