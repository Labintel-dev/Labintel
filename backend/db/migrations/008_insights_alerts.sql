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
