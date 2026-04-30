-- Migration 002: lab_staff
DO $$ BEGIN
  CREATE TYPE staff_role AS ENUM ('administrator', 'manager', 'receptionist', 'technician');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS lab_staff (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id       UUID        NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  supabase_uid UUID        UNIQUE,
  full_name    VARCHAR(100) NOT NULL,
  email        VARCHAR(200) UNIQUE NOT NULL,
  role         staff_role  NOT NULL,
  is_active    BOOLEAN     DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
