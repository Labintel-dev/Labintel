-- Migration 014: require reports to belong to a registered lab patient.
-- A report is valid only when its (lab_id, patient_id) pair exists in lab_patients.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reports_lab_patient_pair_fkey'
  ) THEN
    ALTER TABLE reports
      ADD CONSTRAINT reports_lab_patient_pair_fkey
      FOREIGN KEY (lab_id, patient_id)
      REFERENCES lab_patients(lab_id, patient_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lab_patients_lab_code_unique
  ON lab_patients(lab_id, lab_patient_code)
  WHERE lab_patient_code IS NOT NULL;
