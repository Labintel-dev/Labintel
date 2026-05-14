-- Migration 001: labs (top-level tenant entity)
CREATE TABLE IF NOT EXISTS labs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(50)  UNIQUE NOT NULL,
  name          VARCHAR(200) NOT NULL,
  phone         VARCHAR(20),
  address       TEXT,
  logo_url      TEXT,
  primary_color VARCHAR(7)   DEFAULT '#1A5276',
  is_active     BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);
