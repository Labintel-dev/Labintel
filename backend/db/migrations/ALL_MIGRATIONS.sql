-- Migration 001: labs (top-level tenant entity)
CREATE TABLE IF NOT EXISTS labs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(50)  UNIQUE NOT NULL,
  name          VARCHAR(200) NOT NULL,
  phone         VARCHAR(20),
  address       TEXT,
  logo_url      TEXT,
  primary_color VARCHAR(7)   DEFAULT '#1A5276',
  is_active     BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);
-- Migration 002: lab_staff
DO $$ BEGIN
  CREATE TYPE staff_role AS ENUM ('administrator', 'receptionist', 'technician');
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
-- Migration 004: lab_patients (bridge table)
-- Records the many-to-many relationship between labs and patients.
-- A patient can appear at multiple labs.
CREATE TABLE IF NOT EXISTS lab_patients (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id           UUID        NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  patient_id       UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  lab_patient_code VARCHAR(50),
  referred_by      VARCHAR(200),
  registered_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lab_id, patient_id)
);
-- Migration 005: test_panels + test_parameters
CREATE TABLE IF NOT EXISTS test_panels (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id     UUID         NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  name       VARCHAR(200) NOT NULL,
  short_code VARCHAR(20),
  price      NUMERIC(10,2),
  is_active  BOOLEAN      DEFAULT TRUE
);

-- Each parameter belongs to one panel and has gender-split reference ranges
CREATE TABLE IF NOT EXISTS test_parameters (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id       UUID         NOT NULL REFERENCES test_panels(id) ON DELETE CASCADE,
  name           VARCHAR(200) NOT NULL,
  unit           VARCHAR(50),
  ref_min_male   NUMERIC,
  ref_max_male   NUMERIC,
  ref_min_female NUMERIC,
  ref_max_female NUMERIC,
  max_plausible  NUMERIC,
  sort_order     INTEGER      DEFAULT 0
);
-- Migration 006: reports (central table — dual lab_id + patient_id key)
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('draft', 'in_review', 'released');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS reports (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id       UUID          NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  patient_id   UUID          NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  panel_id     UUID          NOT NULL REFERENCES test_panels(id),
  collected_at TIMESTAMPTZ,
  reported_at  TIMESTAMPTZ,
  status       report_status NOT NULL DEFAULT 'draft',
  pdf_url      TEXT,
  share_token  UUID          DEFAULT gen_random_uuid() UNIQUE,
  created_by   UUID          REFERENCES lab_staff(id),
  created_at   TIMESTAMPTZ   DEFAULT NOW()
);
-- Migration 007: test_values (one row per parameter per report)
DO $$ BEGIN
  CREATE TYPE flag_type AS ENUM ('normal', 'low', 'high', 'critical_low', 'critical_high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS test_values (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id    UUID      NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  parameter_id UUID      NOT NULL REFERENCES test_parameters(id),
  value        NUMERIC   NOT NULL,
  flag         flag_type DEFAULT 'normal'
);
-- Migration 008: report_insights + health_alerts
DO $$ BEGIN
  CREATE TYPE alert_type_enum AS ENUM ('critical_value', 'worsening_trend', 'persistent_abnormal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AI-generated insight — exactly one per report
CREATE TABLE IF NOT EXISTS report_insights (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       UUID        NOT NULL UNIQUE REFERENCES reports(id) ON DELETE CASCADE,
  summary         TEXT,
  findings        JSONB       DEFAULT '[]',
  recommendation  TEXT,
  model_used      VARCHAR(100),
  generated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Nightly cron creates these — patient-scoped, not report-scoped
CREATE TABLE IF NOT EXISTS health_alerts (
  id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id       UUID            NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  patient_id   UUID            NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  parameter_id UUID            NOT NULL REFERENCES test_parameters(id),
  alert_type   alert_type_enum NOT NULL,
  message      TEXT,
  is_read      BOOLEAN         DEFAULT FALSE,
  triggered_at TIMESTAMPTZ     DEFAULT NOW()
);
-- Migration 009: otp_sessions (temporary — rows deleted after verification)
-- OTPs are NEVER stored in plaintext — always bcrypt hashed
CREATE TABLE IF NOT EXISTS otp_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      VARCHAR(15) UNIQUE NOT NULL,
  hashed_otp TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts   INTEGER     DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Migration 010: Row-Level Security + Indexes

-- ─── Enable RLS on all tables ────────────────────────────────────────────────
ALTER TABLE lab_staff       ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_patients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_panels     ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_values     ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_alerts   ENABLE ROW LEVEL SECURITY;

-- ─── lab_staff: only see own lab's staff ─────────────────────────────────────
DROP POLICY IF EXISTS "lab_staff_isolation" ON lab_staff;
CREATE POLICY "lab_staff_isolation" ON lab_staff
  FOR ALL USING (lab_id = (auth.jwt() ->> 'lab_id')::uuid);

-- ─── lab_patients: only see own lab's patients ───────────────────────────────
DROP POLICY IF EXISTS "lab_patients_isolation" ON lab_patients;
CREATE POLICY "lab_patients_isolation" ON lab_patients
  FOR ALL USING (lab_id = (auth.jwt() ->> 'lab_id')::uuid);

-- ─── test_panels: only see own lab's panels ──────────────────────────────────
DROP POLICY IF EXISTS "test_panels_isolation" ON test_panels;
CREATE POLICY "test_panels_isolation" ON test_panels
  FOR ALL USING (lab_id = (auth.jwt() ->> 'lab_id')::uuid);

-- ─── reports: only see own lab's reports ─────────────────────────────────────
DROP POLICY IF EXISTS "reports_isolation" ON reports;
CREATE POLICY "reports_isolation" ON reports
  FOR ALL USING (
    lab_id = (auth.jwt() ->> 'lab_id')::uuid
    OR patient_id = (auth.jwt() ->> 'patient_id')::uuid
  );

-- ─── health_alerts: only see own lab's alerts ────────────────────────────────
DROP POLICY IF EXISTS "health_alerts_isolation" ON health_alerts;
CREATE POLICY "health_alerts_isolation" ON health_alerts
  FOR ALL USING (lab_id = (auth.jwt() ->> 'lab_id')::uuid);

-- ─── patients: staff sees all (via lab_id claim); patient sees own row ────────
DROP POLICY IF EXISTS "patients_access" ON patients;
CREATE POLICY "patients_access" ON patients
  FOR ALL USING (
    id = (auth.jwt() ->> 'patient_id')::uuid
    OR (auth.jwt() ->> 'lab_id') IS NOT NULL
  );

-- ─── test_parameters: reachable if panel belongs to caller's lab ──────────────
DROP POLICY IF EXISTS "test_parameters_isolation" ON test_parameters;
CREATE POLICY "test_parameters_isolation" ON test_parameters
  FOR ALL USING (
    panel_id IN (
      SELECT id FROM test_panels
      WHERE lab_id = (auth.jwt() ->> 'lab_id')::uuid
    )
  );

-- ─── test_values: reachable if report belongs to caller ──────────────────────
DROP POLICY IF EXISTS "test_values_isolation" ON test_values;
CREATE POLICY "test_values_isolation" ON test_values
  FOR ALL USING (
    report_id IN (
      SELECT id FROM reports
      WHERE lab_id    = (auth.jwt() ->> 'lab_id')::uuid
         OR patient_id = (auth.jwt() ->> 'patient_id')::uuid
    )
  );

-- ─── report_insights: same scope as test_values ──────────────────────────────
DROP POLICY IF EXISTS "report_insights_isolation" ON report_insights;
CREATE POLICY "report_insights_isolation" ON report_insights
  FOR ALL USING (
    report_id IN (
      SELECT id FROM reports
      WHERE lab_id    = (auth.jwt() ->> 'lab_id')::uuid
         OR patient_id = (auth.jwt() ->> 'patient_id')::uuid
    )
  );

-- ─── Performance indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lab_patients_lab_id     ON lab_patients(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_patients_patient_id ON lab_patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_lab_id          ON reports(lab_id);
CREATE INDEX IF NOT EXISTS idx_reports_patient_id      ON reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_status          ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at      ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_values_report_id   ON test_values(report_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone          ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_health_alerts_lab_id    ON health_alerts(lab_id);
CREATE INDEX IF NOT EXISTS idx_health_alerts_is_read   ON health_alerts(is_read);
