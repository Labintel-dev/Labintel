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
