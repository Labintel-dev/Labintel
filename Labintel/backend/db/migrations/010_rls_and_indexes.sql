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
