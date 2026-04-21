-- LabIntel Database Schema
-- Run this in the Supabase SQL Editor

-- Drop tables if they exist
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS labs CASCADE;

-- Create labs table
CREATE TABLE labs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code VARCHAR(4) NOT NULL,
  subdomain TEXT,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','TRIAL','INACTIVE')),
  patients_count INTEGER DEFAULT 0,
  reports_count INTEGER DEFAULT 0,
  live_now INTEGER DEFAULT 0,
  avatar_color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  initials VARCHAR(4) NOT NULL,
  role TEXT NOT NULL,
  assigned_lab TEXT,
  reports_this_month TEXT DEFAULT '—',
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ON LEAVE','INACTIVE')),
  avatar_color TEXT DEFAULT '#6366f1',
  is_owner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('success','info','warning','error')),
  lab_name TEXT,
  time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  lab TEXT NOT NULL,
  subdomain TEXT,
  active_count INTEGER DEFAULT 0,
  max_count INTEGER DEFAULT 50,
  color TEXT DEFAULT '#00d4aa',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Allow full access policies
CREATE POLICY "Allow all on labs" ON labs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
