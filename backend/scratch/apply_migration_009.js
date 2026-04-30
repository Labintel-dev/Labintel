const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('Connected to DB. Applying migration 009...');
  try {
    await client.query('ALTER TABLE patients ALTER COLUMN phone DROP NOT NULL;');
    console.log('Step 1: Phone dropped NOT NULL');
    await client.query('ALTER TABLE patients ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;');
    console.log('Step 2: Email column added');
    await client.query('ALTER TABLE patients DROP CONSTRAINT IF EXISTS check_phone_or_email;');
    await client.query('ALTER TABLE patients ADD CONSTRAINT check_phone_or_email CHECK (phone IS NOT NULL OR email IS NOT NULL);');
    console.log('Step 3: Check constraint added');
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
