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

const normalizeResultItem = (item = {}) => {
  const low = item?.low ?? item?.min;
  const high = item?.high ?? item?.max;
  const derivedRange =
    item?.range ||
    (low !== undefined && high !== undefined ? `${low}-${high}` : '');

  return {
    name: item?.name || item?.parameter || item?.label || 'Unknown Marker',
    value: item?.value ?? '',
    unit: item?.unit || '',
    range: derivedRange,
    flag: item?.flag || item?.status || 'Normal',
  };
};

function extractResultsAndAttachment(rawResults) {
  if (Array.isArray(rawResults)) {
    return {
      results: rawResults.map(normalizeResultItem),
      attachment: null,
    };
  }

  if (rawResults && typeof rawResults === 'object') {
    const attachment = rawResults.attachment || rawResults.file || null;
    const items = Array.isArray(rawResults.items)
      ? rawResults.items
      : Array.isArray(rawResults.parameters)
        ? rawResults.parameters
        : Array.isArray(rawResults.results)
          ? rawResults.results
          : [];

    return {
      results: items.map(normalizeResultItem),
      attachment,
    };
  }

  return {
    results: [],
    attachment: null,
  };
}

function normalizeReport(record = {}) {
  const { results, attachment } = extractResultsAndAttachment(record.results);
  const testName = record.test_name || record.testName || 'Diagnostic Report';
  const fileName =
    attachment?.fileName ||
    attachment?.name ||
    record.file_name ||
    record.fileName ||
    `${testName}.pdf`;
  const downloadUrl =
    attachment?.dataUrl ||
    attachment?.url ||
    record.report_url ||
    record.file_url ||
    record.download_url ||
    null;

  return {
    ...record,
    patientId: record.patient_id || record.patientId || '',
    patientName: record.patient_name || record.patientName || 'Unknown Patient',
    testName,
    uploadedBy: record.uploaded_by || record.uploadedBy || 'Lab Technician',
    status: record.status || 'Pending',
    category: record.category || 'General',
    date: record.date || record.created_at || '',
    results,
    attachment,
    downloadUrl,
    fileName,
    hasAttachment: Boolean(downloadUrl),
  };
}

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
  const { data, error } = await supabase
    .from('patient')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data || null
}

export async function upsertProfile(userId, profileData) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase
    .from('patient')
    .upsert({ id: userId, ...profileData }, { onConflict: 'id' })
    .select()
    .single()
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
  return (data || []).map(normalizeReport)
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
