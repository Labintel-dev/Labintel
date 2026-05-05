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
