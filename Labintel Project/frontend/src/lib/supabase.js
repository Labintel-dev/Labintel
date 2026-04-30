import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_KEY = 'placeholder-anon-key';
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const resolvedSupabaseUrl = isSupabaseConfigured ? supabaseUrl : FALLBACK_SUPABASE_URL;
const resolvedSupabaseAnonKey = isSupabaseConfigured ? supabaseAnonKey : FALLBACK_SUPABASE_KEY;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase configuration missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).'
  );
}

function ensureSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }
}

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey);

// Mock options for Dashboards (used by Dashboards.jsx)
export const TEST_OPTIONS = [
  'Complete Blood Count (CBC)',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Lipid Profile',
  'Thyroid Profile (T3, T4, TSH)',
  'Blood Glucose (Fasting)',
  'HbA1c',
  'Urine Routine Examination',
  'ESR',
  'CRP'
];

export const CATEGORY_OPTIONS = [
  'Hematology',
  'Biochemistry',
  'Serology',
  'Urine Analysis',
  'Microbiology',
  'Immunology',
  'Coagulation',
  'Hormone',
  'Tumor Marker'
];

// Auth helpers
export async function signIn(email, password) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUp(email, password, options = {}) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password, 
    options: {
      data: {
        role: 'patient',
        ...options
      }
    }
  })
  if (error) throw error
  return data
}

export async function requestPasswordReset(email) {
  ensureSupabaseConfigured();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function getSession() {
  ensureSupabaseConfigured();
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function signOut() {
  ensureSupabaseConfigured();
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Profiles (patients table)
export async function getProfile(userId) {
  ensureSupabaseConfigured();
  // First try matching by id (if patient auth uid matches patients.id)
  const { data: byId } = await supabase
    .from('patients')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (byId) return byId;
  return null;
}

export async function upsertProfile(userId, profileData) {
  ensureSupabaseConfigured();
  // Map dob -> date_of_birth to match DB schema
  // Strip 'role' as it's not in the patients table
  const { dob, role, ...rest } = profileData;
  const mapped = { ...rest };
  if (dob) mapped.date_of_birth = dob;
  const { data, error } = await supabase
    .from('patients')
    .upsert({ id: userId, ...mapped }, { onConflict: 'id' })
    .select()
    .maybeSingle()
  if (error) throw error
  return data
}

// Avatar upload
export async function uploadAvatar(userId, file) {
  ensureSupabaseConfigured();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return publicUrl;
}

// Reports
export async function getReports(patientId) {
  ensureSupabaseConfigured();
  let query = supabase
    .from('reports')
    .select('*')

  if (patientId) {
    query = query.eq('patient_id', patientId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createReport(reportData) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase
    .from('reports')
    .insert(reportData)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateReportStatus(reportId, status) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', reportId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Realtime subscription
export function subscribeToReports(patientId, callback) {
  ensureSupabaseConfigured();
  return supabase
    .channel('reports')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'reports', filter: patientId ? `patient_id=eq.${patientId}` : undefined },
      callback
    )
    .subscribe()
}
