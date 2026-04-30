'use strict';
/**
 * run_migration_015.js
 * Applies 015_attendance.sql to the Supabase Postgres database.
 * Run once with: node scratch/run_migration_015.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');
const fs   = require('fs');
const path = require('path');

const sql = fs.readFileSync(
  path.join(__dirname, '../db/migrations/015_attendance.sql'),
  'utf8'
);

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅  Connected to Supabase Postgres');

    await client.query(sql);
    console.log('✅  Migration 015_attendance.sql applied successfully');
  } catch (err) {
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
