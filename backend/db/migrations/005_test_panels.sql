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
