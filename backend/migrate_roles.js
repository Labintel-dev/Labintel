require('dotenv').config();
const { Pool } = require('pg');

// Convert pooler URL to direct database URL for DDL operations
let directUrl = process.env.DATABASE_URL;
if (directUrl && directUrl.includes('pooler.supabase.com')) {
  // FROM: postgresql://postgres.lmnksoothkgzgurmumni:PW@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
  // TO:   postgresql://postgres:PW@db.lmnksoothkgzgurmumni.supabase.co:5432/postgres
  directUrl = directUrl.replace('postgres.lmnksoothkgzgurmumni', 'postgres');
  directUrl = directUrl.replace('aws-0-ap-south-1.pooler.supabase.com:6543', 'db.lmnksoothkgzgurmumni.supabase.co:5432');
}

const pool = new Pool({
  connectionString: directUrl,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Starting migration to drop "administrator" role completely...');
  console.log('Using Direct URL:', directUrl);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Ensure 'manager' exists in staff_role enum (if it doesn't already)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'staff_role' AND e.enumlabel = 'manager'
        ) THEN
          ALTER TYPE staff_role ADD VALUE 'manager';
        END IF;
      END $$;
    `);
    console.log('[1/4] Ensured "manager" role exists in ENUM.');

    // 2. Update existing administrator records in lab_staff table to manager
    const updateRes = await client.query(`
      UPDATE public.lab_staff
      SET role = 'manager'
      WHERE role = 'administrator';
    `);
    console.log(`[2/4] Updated ${updateRes.rowCount} "administrator" rows to "manager" in lab_staff.`);

    // 3. Update the Supabase Auth users' raw_app_meta_data JSON to fix claims natively
    const authRes = await client.query(`
      UPDATE auth.users
      SET raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb), 
        '{role}', 
        '"manager"'
      )
      WHERE raw_app_meta_data->>'role' = 'administrator';
    `);
    console.log(`[3/4] Updated ${authRes.rowCount} auth.users app_metadata claims.`);

    // 4. Recreate the enum to completely drop 'administrator'
    await client.query(`
      -- Step A: rename old enum
      ALTER TYPE staff_role RENAME TO staff_role_old;
      
      -- Step B: create new enum with only the 3 required values
      CREATE TYPE staff_role AS ENUM ('manager', 'receptionist', 'technician');
      
      -- Step C: update table column to use new enum (with cast)
      ALTER TABLE public.lab_staff 
        ALTER COLUMN role TYPE staff_role 
        USING role::text::staff_role;
        
      -- Step D: drop the old enum type
      DROP TYPE staff_role_old;
    `);
    console.log('[4/4] Safely dropped "administrator" from staff_role ENUM.');

    // 5. Fix the trigger function so it doesn't map 'administrator' anymore
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS internal;
      
      CREATE OR REPLACE FUNCTION internal.sync_auth_claims_from_lab_staff()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, auth, pg_catalog
      AS $func$
      BEGIN
        IF NEW.supabase_uid IS NULL THEN
          RETURN NEW;
        END IF;

        UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
          || jsonb_build_object(
            'role', NEW.role::text,
            'lab_id', NEW.lab_id::text,
            'staff_id', NEW.id::text
          )
        WHERE id = NEW.supabase_uid;

        RETURN NEW;
      END;
      $func$;
    `);
    console.log('[5/5] Replaced trigger function internal.sync_auth_claims_from_lab_staff.');

    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed, rolled back changes:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
