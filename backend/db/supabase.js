'use strict';
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl        = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey    = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
}

/**
 * Admin client — service_role key, bypasses RLS.
 * Use this for ALL database reads/writes on the server.
 * NEVER call signInWithPassword on this client — it mutates the session
 * and causes subsequent queries to run under the user JWT instead of service_role.
 */
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Auth-only client — used exclusively for signInWithPassword / signOut.
 * Kept separate so its session changes don't affect the admin client.
 */
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

module.exports = supabase;
module.exports.supabaseAuth = supabaseAuth;

