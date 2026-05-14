-- Migration 012: add manager role to staff_role enum for existing databases
DO $$
BEGIN
  ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'manager';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
