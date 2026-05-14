-- Migration 015: Staff Attendance Tracking
-- Creates the staff_attendance table with unique constraint and RLS policies.

-- ── Table ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    UUID NOT NULL REFERENCES lab_staff(id) ON DELETE CASCADE,
  lab_id      UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  check_in    TIMESTAMPTZ NOT NULL,
  check_out   TIMESTAMPTZ,
  status      VARCHAR(20) NOT NULL DEFAULT 'present'
                CHECK (status IN ('present', 'absent', 'half_day')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Unique constraint: one record per staff member per day ────────────────────
ALTER TABLE staff_attendance
  DROP CONSTRAINT IF EXISTS staff_attendance_staff_date_unique;
ALTER TABLE staff_attendance
  ADD CONSTRAINT staff_attendance_staff_date_unique
  UNIQUE (staff_id, date);

-- ── Performance indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_attendance_lab_id    ON staff_attendance(lab_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_id  ON staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date      ON staff_attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_lab_date  ON staff_attendance(lab_id, date DESC);

-- ── Enable RLS ────────────────────────────────────────────────────────────────
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

-- ── RLS Policy: staff can INSERT their own attendance rows ─────────────────────
DROP POLICY IF EXISTS "attendance_staff_insert" ON staff_attendance;
CREATE POLICY "attendance_staff_insert" ON staff_attendance
  FOR INSERT
  WITH CHECK (
    lab_id = (auth.jwt() ->> 'lab_id')::uuid
  );

-- ── RLS Policy: staff can SELECT/UPDATE their own rows ────────────────────────
DROP POLICY IF EXISTS "attendance_staff_own_access" ON staff_attendance;
CREATE POLICY "attendance_staff_own_access" ON staff_attendance
  FOR ALL
  USING (
    staff_id IN (
      SELECT id FROM lab_staff WHERE supabase_uid = auth.uid()
    )
  );

-- ── RLS Policy: managers/administrators can SELECT all rows for their lab ──────
DROP POLICY IF EXISTS "attendance_manager_read" ON staff_attendance;
CREATE POLICY "attendance_manager_read" ON staff_attendance
  FOR SELECT
  USING (
    lab_id = (auth.jwt() ->> 'lab_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('manager', 'administrator')
  );
