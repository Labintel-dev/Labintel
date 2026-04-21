import { supabase } from './supabase.js';

/*
  Run this AFTER creating the tables in your Supabase SQL editor.

  ── SQL to create tables (run in Supabase SQL Editor) ──

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

  CREATE TABLE activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('success','info','warning','error')),
    lab_name TEXT,
    time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

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
*/

async function seed() {
  console.log('🌱 Seeding LabIntel database...\n');

  // Clear existing data
  await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('labs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Seed labs
  const { data: labs, error: labErr } = await supabase.from('labs').insert([
    { name: 'Apollo Diagnostics', code: 'AP', subdomain: 'apollolab.labintel.in', status: 'ACTIVE', patients_count: 1204, reports_count: 342, live_now: 34, avatar_color: '#6366f1' },
    { name: 'Sunrise Diagnostics', code: 'SR', subdomain: 'sunrise.labintel.in', status: 'ACTIVE', patients_count: 870, reports_count: 215, live_now: 22, avatar_color: '#f59e0b' },
    { name: 'City Lab Mumbai', code: 'CL', subdomain: 'citylab.labintel.in', status: 'TRIAL', patients_count: 430, reports_count: 98, live_now: 16, avatar_color: '#10b981' },
    { name: 'NovaCare Labs', code: 'NL', subdomain: 'novacare.labintel.in', status: 'INACTIVE', patients_count: 120, reports_count: 44, live_now: 0, avatar_color: '#ef4444' },
    { name: 'MedCare Pathology', code: 'MP', subdomain: 'medcare.labintel.in', status: 'ACTIVE', patients_count: 654, reports_count: 189, live_now: 18, avatar_color: '#8b5cf6' },
    { name: 'HealthFirst Labs', code: 'HF', subdomain: 'healthfirst.labintel.in', status: 'ACTIVE', patients_count: 310, reports_count: 76, live_now: 7, avatar_color: '#ec4899' },
    { name: 'DiagnoPlus', code: 'DP', subdomain: 'diagnoplus.labintel.in', status: 'ACTIVE', patients_count: 198, reports_count: 55, live_now: 9, avatar_color: '#14b8a6' },
    { name: 'PrimeLab India', code: 'PL', subdomain: 'primelab.labintel.in', status: 'ACTIVE', patients_count: 35, reports_count: 12, live_now: 3, avatar_color: '#f97316' },
  ]).select();
  if (labErr) { console.error('Lab seed error:', labErr); return; }
  console.log(`✅ Seeded ${labs.length} labs`);

  // Seed team members
  const { data: team, error: teamErr } = await supabase.from('team_members').insert([
    { name: 'Rahul Agarwal', initials: 'RA', role: 'LEAD DEV', assigned_lab: 'All Labs', reports_this_month: '—', status: 'ACTIVE', avatar_color: '#6366f1', is_owner: true },
    { name: 'Priya Sharma', initials: 'PS', role: 'DEVELOPER', assigned_lab: 'Apollo, Sunrise', reports_this_month: '128', status: 'ACTIVE', avatar_color: '#ec4899' },
    { name: 'Arjun Kumar', initials: 'AK', role: 'DESIGNER', assigned_lab: 'All Labs (UI)', reports_this_month: '—', status: 'ACTIVE', avatar_color: '#f59e0b' },
    { name: 'Neha Patil', initials: 'NP', role: 'DEVELOPER', assigned_lab: 'CityLab, MedCare', reports_this_month: '74', status: 'ACTIVE', avatar_color: '#ef4444' },
    { name: 'Vikram Mehta', initials: 'VM', role: 'DEVELOPER', assigned_lab: 'HealthFirst', reports_this_month: '51', status: 'ON LEAVE', avatar_color: '#10b981' },
    { name: 'Sneha Rao', initials: 'SR', role: 'QA ENGINEER', assigned_lab: 'All Labs', reports_this_month: '—', status: 'ACTIVE', avatar_color: '#8b5cf6' },
    { name: 'Amit Desai', initials: 'AD', role: 'BACKEND DEV', assigned_lab: 'Apollo, NovaCare', reports_this_month: '96', status: 'ACTIVE', avatar_color: '#06b6d4' },
    { name: 'Kavita Joshi', initials: 'KJ', role: 'DATA ANALYST', assigned_lab: 'All Labs', reports_this_month: '203', status: 'ACTIVE', avatar_color: '#f97316' },
    { name: 'Rohan Gupta', initials: 'RG', role: 'DEVOPS', assigned_lab: 'Infrastructure', reports_this_month: '—', status: 'ACTIVE', avatar_color: '#14b8a6' },
    { name: 'Meera Nair', initials: 'MN', role: 'SUPPORT', assigned_lab: 'All Labs', reports_this_month: '45', status: 'ACTIVE', avatar_color: '#a855f7' },
  ]).select();
  if (teamErr) { console.error('Team seed error:', teamErr); return; }
  console.log(`✅ Seeded ${team.length} team members`);

  // Seed activity logs
  const { data: activity, error: actErr } = await supabase.from('activity_logs').insert([
    { message: 'Apollo released 12 reports', type: 'success', lab_name: 'Apollo', time: '2 min ago' },
    { message: 'New lab HealthFirst onboarded', type: 'info', lab_name: 'HealthFirst', time: '18 min ago' },
    { message: 'Alert engine: 3 critical values at Sunrise', type: 'warning', lab_name: 'Sunrise', time: '1 hr ago' },
    { message: 'NovaCare deactivated by Rahul', type: 'error', lab_name: 'NovaCare', time: '3 hrs ago' },
    { message: 'Priya added as Tech at CityLab', type: 'info', lab_name: 'CityLab', time: '5 hrs ago' },
    { message: 'PDF generation: 34 PDFs queued Apollo', type: 'info', lab_name: 'Apollo', time: '7 hrs ago' },
    { message: 'Daily backup completed — all labs', type: 'success', lab_name: null, time: 'Last night 11 PM' },
  ]).select();
  if (actErr) { console.error('Activity seed error:', actErr); return; }
  console.log(`✅ Seeded ${activity.length} activity logs`);

  // Seed sessions
  const apolloLab = labs.find(l => l.code === 'AP');
  const sunriseLab = labs.find(l => l.code === 'SR');
  const cityLab = labs.find(l => l.code === 'CL');
  const medcareLab = labs.find(l => l.code === 'MP');
  const healthLab = labs.find(l => l.code === 'HF');

  const { data: sessions, error: sesErr } = await supabase.from('sessions').insert([
    { lab_id: apolloLab.id, lab: 'Apollo Diagnostics', subdomain: 'apollolab.labintel.in', active_count: 34, color: '#00d4aa' },
    { lab_id: sunriseLab.id, lab: 'Sunrise Diagnostics', subdomain: 'sunrise.labintel.in', active_count: 22, color: '#06b6d4' },
    { lab_id: cityLab.id, lab: 'City Lab Mumbai', subdomain: 'citylab.labintel.in', active_count: 16, color: '#3b82f6' },
    { lab_id: medcareLab.id, lab: 'MedCare Pathology', subdomain: 'medcare.labintel.in', active_count: 18, color: '#6366f1' },
    { lab_id: healthLab.id, lab: 'HealthFirst Labs', subdomain: 'healthfirst.labintel.in', active_count: 7, color: '#8b5cf6' },
  ]).select();
  if (sesErr) { console.error('Session seed error:', sesErr); return; }
  console.log(`✅ Seeded ${sessions.length} sessions`);

  console.log('\n🎉 Database seeded successfully!');
}

seed().catch(console.error);
