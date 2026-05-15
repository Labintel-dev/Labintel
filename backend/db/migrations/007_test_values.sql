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
