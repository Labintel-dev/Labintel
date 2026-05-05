-- Migration 011: Enterprise-safe extension for lab workflow
-- Non-destructive only: reuse existing tables, add missing columns/tables/indexes/policies.

-- 1) Extend existing role enum to include manager (maps from existing administrator role).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'staff_role' AND n.nspname = 'public'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'staff_role' AND e.enumlabel = 'manager'
  ) THEN
    ALTER TYPE staff_role ADD VALUE 'manager';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) Extend patients table with enterprise fields (preserves existing rows/data).
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS patient_code TEXT;
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE IF EXISTS patients ADD COLUMN IF NOT EXISTS created_by UUID;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patients')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'patients_created_by_fkey'
     )
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lab_staff')
  THEN
    ALTER TABLE patients
      ADD CONSTRAINT patients_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES lab_staff(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patients_age_non_negative')
  THEN
    ALTER TABLE patients ADD CONSTRAINT patients_age_non_negative CHECK (age IS NULL OR age >= 0);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_patients_patient_code_not_null
  ON patients(patient_code)
  WHERE patient_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at DESC);

-- 3) Compatibility mapping: expose required table names without duplicating legacy entities.
-- If lab_staff exists, create compatibility view staff_users.
DO $$
BEGIN
  IF to_regclass('public.staff_users') IS NULL THEN
    IF to_regclass('public.lab_staff') IS NOT NULL THEN
      EXECUTE $v$
        CREATE VIEW staff_users AS
        SELECT
          ls.id,
          ls.supabase_uid AS auth_user_id,
          ls.full_name,
          ls.email,
          CASE
            WHEN ls.role::text = 'administrator' THEN 'manager'
            ELSE ls.role::text
          END AS role,
          NULL::text AS phone,
          CASE WHEN ls.is_active THEN 'active' ELSE 'inactive' END AS status,
          ls.created_at
        FROM lab_staff ls
      $v$;
    ELSE
      CREATE TABLE staff_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('receptionist', 'technician', 'manager')),
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    END IF;
  END IF;
END $$;

-- If test_panels exists, create compatibility view tests_master.
DO $$
BEGIN
  IF to_regclass('public.tests_master') IS NULL THEN
    IF to_regclass('public.test_panels') IS NOT NULL THEN
      EXECUTE $v$
        CREATE VIEW tests_master AS
        SELECT
          tp.id,
          tp.name AS test_name,
          COALESCE(tp.short_code, 'General') AS category,
          tp.price,
          NULL::text AS normal_range,
          tp.is_active AS active
        FROM test_panels tp
      $v$;
    ELSE
      CREATE TABLE tests_master (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_name TEXT NOT NULL,
        category TEXT,
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        normal_range TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE
      );
    END IF;
  END IF;
END $$;

-- 4) New booking workflow tables (create only if missing).
CREATE TABLE IF NOT EXISTS patient_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  receptionist_id UUID REFERENCES lab_staff(id) ON DELETE SET NULL,
  lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  sample_status TEXT NOT NULL DEFAULT 'pending',
  urgent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  CHECK (sample_status IN ('pending', 'collected', 'processing', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES patient_orders(id) ON DELETE CASCADE,
  test_id UUID NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_test_id_fkey_test_panels')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_panels')
  THEN
    ALTER TABLE order_items
      ADD CONSTRAINT order_items_test_id_fkey_test_panels
      FOREIGN KEY (test_id) REFERENCES test_panels(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES lab_staff(id) ON DELETE SET NULL,
  parameter_name TEXT NOT NULL,
  result_value TEXT,
  unit TEXT,
  normal_range TEXT,
  abnormal_flag BOOLEAN NOT NULL DEFAULT FALSE,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  source_test_value_id UUID REFERENCES test_values(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_patient_orders_patient_id ON patient_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_orders_receptionist_id ON patient_orders(receptionist_id);
CREATE INDEX IF NOT EXISTS idx_patient_orders_lab_id ON patient_orders(lab_id);
CREATE INDEX IF NOT EXISTS idx_patient_orders_created_at ON patient_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_orders_status ON patient_orders(payment_status, sample_status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_test_id ON order_items(test_id);
CREATE INDEX IF NOT EXISTS idx_order_items_unique_order_test ON order_items(order_id, test_id);

CREATE INDEX IF NOT EXISTS idx_test_results_order_item_id ON test_results(order_item_id);
CREATE INDEX IF NOT EXISTS idx_test_results_patient_id ON test_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_test_results_technician_id ON test_results(technician_id);
CREATE INDEX IF NOT EXISTS idx_test_results_entered_at ON test_results(entered_at DESC);

-- 5) Supabase Auth integration: keep auth.users app_metadata role/lab/staff in sync.
CREATE SCHEMA IF NOT EXISTS internal;

CREATE OR REPLACE FUNCTION internal.sync_auth_claims_from_lab_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  mapped_role TEXT;
BEGIN
  IF NEW.supabase_uid IS NULL THEN
    RETURN NEW;
  END IF;

  mapped_role := CASE
    WHEN NEW.role::text = 'administrator' THEN 'manager'
    ELSE NEW.role::text
  END;

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'role', mapped_role,
      'lab_id', NEW.lab_id::text,
      'staff_id', NEW.id::text
    )
  WHERE id = NEW.supabase_uid;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION internal.sync_auth_claims_from_lab_staff() FROM PUBLIC;

DO $$
BEGIN
  IF to_regclass('public.lab_staff') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_trigger
       WHERE tgname = 'trg_sync_auth_claims_from_lab_staff'
     )
  THEN
    CREATE TRIGGER trg_sync_auth_claims_from_lab_staff
    AFTER INSERT OR UPDATE OF role, lab_id, supabase_uid
    ON lab_staff
    FOR EACH ROW
    EXECUTE FUNCTION internal.sync_auth_claims_from_lab_staff();
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.lab_staff') IS NOT NULL THEN
    UPDATE auth.users u
    SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'role', CASE WHEN ls.role::text = 'administrator' THEN 'manager' ELSE ls.role::text END,
        'lab_id', ls.lab_id::text,
        'staff_id', ls.id::text
      )
    FROM lab_staff ls
    WHERE ls.supabase_uid = u.id;
  END IF;
END $$;

-- 6) RLS policies for receptionist / technician / manager on new workflow tables.
ALTER TABLE patient_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS po_receptionist_create_orders ON patient_orders;
CREATE POLICY po_receptionist_create_orders
  ON patient_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'receptionist'
    AND EXISTS (
      SELECT 1
      FROM lab_staff ls
      WHERE ls.id = patient_orders.receptionist_id
        AND ls.supabase_uid = auth.uid()
    )
  );

DROP POLICY IF EXISTS po_receptionist_read_own_orders ON patient_orders;
CREATE POLICY po_receptionist_read_own_orders
  ON patient_orders
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'receptionist'
    AND EXISTS (
      SELECT 1
      FROM lab_staff ls
      WHERE ls.id = patient_orders.receptionist_id
        AND ls.supabase_uid = auth.uid()
    )
  );

DROP POLICY IF EXISTS po_manager_read_all_orders ON patient_orders;
CREATE POLICY po_manager_read_all_orders
  ON patient_orders
  FOR SELECT
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'manager');

DROP POLICY IF EXISTS oi_staff_read_order_items ON order_items;
CREATE POLICY oi_staff_read_order_items
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('receptionist', 'technician', 'manager')
  );

DROP POLICY IF EXISTS tr_technician_read_pending ON test_results;
CREATE POLICY tr_technician_read_pending
  ON test_results
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'technician'
    AND (
      technician_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM lab_staff ls
        WHERE ls.id = test_results.technician_id
          AND ls.supabase_uid = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS tr_technician_update_results ON test_results;
CREATE POLICY tr_technician_update_results
  ON test_results
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'technician'
    AND EXISTS (
      SELECT 1
      FROM lab_staff ls
      WHERE ls.id = test_results.technician_id
        AND ls.supabase_uid = auth.uid()
    )
  )
  WITH CHECK (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'technician'
    AND EXISTS (
      SELECT 1
      FROM lab_staff ls
      WHERE ls.id = test_results.technician_id
        AND ls.supabase_uid = auth.uid()
    )
  );

DROP POLICY IF EXISTS tr_manager_all ON test_results;
CREATE POLICY tr_manager_all
  ON test_results
  FOR ALL
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'manager')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'manager');

-- Manager staff administration policy on existing table.
ALTER TABLE lab_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lab_staff_manager_manage ON lab_staff;
CREATE POLICY lab_staff_manager_manage
  ON lab_staff
  FOR ALL
  TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'manager')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'manager');
