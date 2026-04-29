#!/usr/bin/env node
'use strict';
/**
 * fixOCRStaffSync.js — Sync Supabase users with lab_staff records
 * 
 * PROBLEM: Users can log in via Supabase but don't have staff records,
 *          causing "staff account not found" errors on OCR and other protected endpoints.
 *
 * SOLUTION: This script finds all Supabase users and creates lab_staff records for them.
 *
 * Usage: npm run fix:ocr-staff-sync
 * 
 * What it does:
 *  1. Lists all Supabase auth users
 *  2. For each user without a staff record, creates one
 *  3. Assigns users to the first (or specified) lab
 *  4. Sets role to 'technician' (can be manually changed in DB)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Helpers ───────────────────────────────────────────────────────────────
function log(msg, level = 'info') {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warn: '⚠️',
    error: '❌',
  }[level] || '•';
  console.log(`${prefix}  ${msg}`);
}

function section(title) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ${title}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

async function main() {
  section('OCR Staff Sync - Fix "Staff Account Not Found" Error');

  try {
    // Step 1: Get first lab (or create demo lab if none exists)
    log('Fetching labs from database...');
    const { data: labs, error: labsError } = await supabase
      .from('labs')
      .select('id, name, slug')
      .limit(1);

    if (labsError || !labs || labs.length === 0) {
      log('No labs found in database. Creating demo lab...', 'warn');
      const { data: newLab, error: createError } = await supabase
        .from('labs')
        .insert({
          name: 'Default Lab',
          slug: 'default-lab',
          phone: '+1-000-0000',
          address: 'Default Location',
          is_active: true,
        })
        .select()
        .single();

      if (createError) throw new Error(`Failed to create default lab: ${createError.message}`);
      labs[0] = newLab;
      log(`Created default lab: "${newLab.name}" (${newLab.id})`, 'success');
    } else {
      log(`Found lab: "${labs[0].name}" (${labs[0].id})`, 'success');
    }

    const targetLabId = labs[0].id;

    // Step 2: List all Supabase auth users
    log('Fetching Supabase auth users...');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw new Error(`Failed to list users: ${usersError.message}`);

    log(`Found ${users.length} Supabase auth user(s)`, 'success');

    if (users.length === 0) {
      log('No auth users found. Please create auth users first via signup or admin panel.', 'warn');
      section('Done');
      return;
    }

    // Step 3: Check which users already have staff records
    log('Checking for existing staff records...');
    const { data: existingStaff, error: staffError } = await supabase
      .from('lab_staff')
      .select('supabase_uid');

    if (staffError) throw new Error(`Failed to fetch staff records: ${staffError.message}`);

    const existingUids = new Set(existingStaff.map(s => s.supabase_uid));
    const usersNeedingStaff = users.filter(u => !existingUids.has(u.id));

    log(`${existingUids.size} user(s) already have staff records`, 'success');
    log(`${usersNeedingStaff.length} user(s) need staff records created`, 'info');

    // Step 4: Create staff records for users without them
    if (usersNeedingStaff.length === 0) {
      log('All users already have staff records!', 'success');
      section('Done');
      return;
    }

    section('Creating Staff Records');
    const newStaffRecords = usersNeedingStaff.map(user => ({
      lab_id: targetLabId,
      supabase_uid: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Staff User',
      email: user.email,
      role: 'technician', // Default role - can be changed manually
      is_active: true,
    }));

    const { data: createdStaff, error: insertError } = await supabase
      .from('lab_staff')
      .insert(newStaffRecords)
      .select();

    if (insertError) throw new Error(`Failed to create staff records: ${insertError.message}`);

    log(`✅ Created ${createdStaff.length} staff record(s)!`, 'success');
    createdStaff.forEach(staff => {
      log(`  • ${staff.full_name} (${staff.email}) → Role: ${staff.role}`, 'success');
    });

    // Step 5: Summary and next steps
    section('Next Steps');
    log('1. Users can now use OCR and other staff features', 'info');
    log('2. To change a staff member\'s role, go to Supabase Dashboard:', 'info');
    log('   → SQL Editor → Run: UPDATE lab_staff SET role = \'manager\' WHERE email = \'user@example.com\'', 'info');
    log('3. Supported roles: administrator, manager, receptionist, technician', 'info');
    log('4. Reload the app and log in again to see the changes', 'info');

    section('Done');
    process.exit(0);
  } catch (err) {
    log(`ERROR: ${err.message}`, 'error');
    section('Failed');
    process.exit(1);
  }
}

main();
