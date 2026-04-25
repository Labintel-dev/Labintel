-- Migration 009: otp_sessions (temporary — rows deleted after verification)
-- OTPs are NEVER stored in plaintext — always bcrypt hashed
CREATE TABLE IF NOT EXISTS otp_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      VARCHAR(15) UNIQUE NOT NULL,
  hashed_otp TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts   INTEGER     DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
