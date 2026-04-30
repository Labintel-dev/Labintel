-- Migration 013: public schema security hardening

ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS labs_staff_read_own_lab ON labs;
CREATE POLICY labs_staff_read_own_lab ON labs
  FOR SELECT
  USING (
    id = NULLIF(auth.jwt() ->> 'lab_id', '')::uuid
  );

DROP POLICY IF EXISTS labs_manager_update_own_lab ON labs;
CREATE POLICY labs_manager_update_own_lab ON labs
  FOR UPDATE
  USING (
    id = NULLIF(auth.jwt() ->> 'lab_id', '')::uuid
    AND (auth.jwt() ->> 'role') IN ('manager', 'administrator')
  )
  WITH CHECK (
    id = NULLIF(auth.jwt() ->> 'lab_id', '')::uuid
    AND (auth.jwt() ->> 'role') IN ('manager', 'administrator')
  );

-- OTP rows are only accessed through the service-role backend.
DROP POLICY IF EXISTS otp_sessions_no_direct_client_access ON otp_sessions;
CREATE POLICY otp_sessions_no_direct_client_access ON otp_sessions
  FOR ALL
  USING (false)
  WITH CHECK (false);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'staff_users' AND c.relkind = 'v'
  ) THEN
    ALTER VIEW staff_users SET (security_invoker = true);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'tests_master' AND c.relkind = 'v'
  ) THEN
    ALTER VIEW tests_master SET (security_invoker = true);
  END IF;
END $$;
