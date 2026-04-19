-- Migration 009: patient email
-- Allows patients to authenticate via Google Auth.
-- Phone is no longer strictly required if email is provided.

ALTER TABLE patients ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE patients ADD COLUMN email VARCHAR(255) UNIQUE;
ALTER TABLE patients ADD CONSTRAINT check_phone_or_email CHECK (phone IS NOT NULL OR email IS NOT NULL);
