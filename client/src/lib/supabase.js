import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_KEY = 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const resolvedSupabaseUrl = isSupabaseConfigured ? supabaseUrl : FALLBACK_SUPABASE_URL;
const resolvedSupabaseAnonKey = isSupabaseConfigured ? supabaseAnonKey : FALLBACK_SUPABASE_KEY;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase configuration missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_* variants).'
  );
}

function ensureSupabaseConfigured() {
  if (!isSupabaseConfigured) {
// Skip throw for demo - use fallback
console.warn('Supabase fallback - set env vars for production');
  }
}

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey);
<<<<<<< HEAD
const PROFILE_TABLES = ['patients', 'patient'];

async function getAccessTokenWithWait(timeoutMs = 4000) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return session.access_token;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      subscription.unsubscribe();
      reject(new Error('Missing session token'));
    }, timeoutMs);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession?.access_token) {
        clearTimeout(timer);
        subscription.unsubscribe();
        resolve(nextSession.access_token);
      }
    });
  });
}

function isMissingTableError(error) {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    String(error.message || '').toLowerCase().includes('could not find the table')
  );
}

function normalizeProfileRow(row) {
  if (!row) return null;
  return {
    ...row,
    dob: row.dob ?? row.date_of_birth ?? '',
    date_of_birth: row.date_of_birth ?? row.dob ?? '',
  };
}

function deriveReportTitle(row) {
  const pdfUrl = String(row?.pdf_url || '').trim();
  if (pdfUrl) {
    try {
      const lastPart = decodeURIComponent(pdfUrl.split('/').pop() || '');
      const withoutExt = lastPart.replace(/\.pdf$/i, '').trim();
      if (withoutExt) return withoutExt;
    } catch {
      // Ignore malformed URL; fallback below.
    }
  }
  return row?.test_panels?.name || row?.panel_id || 'Lab Report';
}
=======
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64

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

// Profiles (patient table)
export async function getProfile(userId) {
  ensureSupabaseConfigured();
<<<<<<< HEAD
  for (const table of PROFILE_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (!error) return normalizeProfileRow(data);
    if (!isMissingTableError(error)) throw error;
  }
  return null;
=======
  const { data, error } = await supabase
    .from('patient')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data || null
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
}

export async function upsertProfile(userId, profileData) {
  ensureSupabaseConfigured();
<<<<<<< HEAD
  const normalizedDob = String(profileData?.dob ?? profileData?.date_of_birth ?? '').trim();
  const payloadByTable = {
    patients: {
      id: userId,
      full_name: profileData?.full_name || profileData?.name || '',
      phone: profileData?.phone || '',
      date_of_birth: normalizedDob || null,
    },
    patient: {
      id: userId,
      full_name: profileData?.full_name || profileData?.name || '',
      phone: profileData?.phone || '',
      dob: normalizedDob || null,
      avatar_url: profileData?.avatar_url || null,
      role: profileData?.role || 'patient',
    },
  };

  for (const table of PROFILE_TABLES) {
    const payload = payloadByTable[table];
    const { data, error } = await supabase
      .from(table)
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();
    if (!error) return normalizeProfileRow(data);
    if (!isMissingTableError(error)) throw error;
  }

  throw new Error('No compatible profile table found (expected "patients" or "patient").');
=======
  const { data, error } = await supabase
    .from('patient')
    .upsert({ id: userId, ...profileData }, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
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
<<<<<<< HEAD
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

  const token = await getAccessTokenWithWait();
  const params = new URLSearchParams();
  if (patientId) params.set('patient_id', patientId);
  const endpoint = `${apiBaseUrl}/api/reports${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed with status ${response.status}`);
  }
  const data = Array.isArray(payload) ? payload : [];

  const normalizeStatus = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'ready' || value === 'released' || value === 'completed') return 'Ready';
    if (value === 'pending') return 'Pending';
    return 'Processing';
  };

  return (data || []).map((row) => {
    // Legacy shape (already expected by dashboard)
    if (row.testName || row.test_name) {
      return {
        ...row,
        id: row.id,
        testName: row.testName || row.test_name || 'Report',
        category: row.category || row.test_panels?.short_code || 'General',
        date: row.date || (row.collected_at ? String(row.collected_at).split('T')[0] : ''),
        status: row.status || 'Pending',
        results: Array.isArray(row.results) ? row.results : [],
      };
    }

    // Current schema shape
    return {
      id: row.id,
      patientId: row.patient_id,
      testName: deriveReportTitle(row),
      category: row.test_panels?.short_code || 'Panel',
      date: row.collected_at ? String(row.collected_at).split('T')[0] : (row.created_at ? String(row.created_at).split('T')[0] : ''),
      status: normalizeStatus(row.status),
      uploadedBy: row.created_by || 'Lab',
      results: [],
      raw: row,
    };
  })
=======
  let query = supabase
    .from('reports')
    .select('*')

  if (patientId) {
    query = query.eq('patient_id', patientId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
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
