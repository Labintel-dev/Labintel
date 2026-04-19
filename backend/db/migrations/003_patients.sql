-- Migration 003: patients (GLOBAL table — no lab_id)
-- A patient is a single global record identified by phone number.
-- This enables cross-lab queries from the patient portal.
DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS patients (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         VARCHAR(15) UNIQUE NOT NULL,
  full_name     VARCHAR(200),
  date_of_birth DATE,
  gender        gender_type,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
