'use strict';

/**
 * Enterprise seed for City Diagnostics / LabIntel
 * - Creates sample auth users only when no staff exists
 * - Creates sample tests only when no panels exist
 * - Non-destructive and idempotent
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureDefaultLab() {
  const { data: existingLab } = await supabase
    .from('labs')
    .select('id, slug, name')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingLab) return existingLab;

  const { data, error } = await supabase
    .from('labs')
    .insert({
      slug: 'city-diagnostics',
      name: 'City Diagnostics',
      phone: '+91-0000-000000',
      address: 'Default branch',
      is_active: true,
    })
    .select('id, slug, name')
    .single();

  if (error) throw new Error(`Failed creating default lab: ${error.message}`);
  return data;
}

async function seedSampleUsersIfEmpty() {
  const { count, error: countError } = await supabase
    .from('lab_staff')
    .select('id', { count: 'exact', head: true });

  if (countError) throw new Error(`Failed counting lab_staff: ${countError.message}`);
  if ((count || 0) > 0) {
    console.log('Skipping user seed: lab_staff is not empty');
    return;
  }

  const lab = await ensureDefaultLab();

  const sampleUsers = [
    { email: 'reception@citydiag.com', password: 'Reception@123', full_name: 'Reception Desk', role: 'receptionist' },
    { email: 'tech@citydiag.com', password: 'Technician@123', full_name: 'Lab Technician', role: 'technician' },
    { email: 'manager@citydiag.com', password: 'Manager@123', full_name: 'Lab Manager', role: 'manager' },
  ];

  for (const u of sampleUsers) {
    const usersResult = await supabase.auth.admin.listUsers();
    if (usersResult.error) throw new Error(`Failed listing auth users: ${usersResult.error.message}`);

    const existing = usersResult.data.users.find((x) => x.email === u.email);
    let authId = existing?.id;

    if (!authId) {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        app_metadata: {
          role: u.role,
          lab_id: lab.id,
        },
        user_metadata: {
          full_name: u.full_name,
        },
      });

      if (createErr) throw new Error(`Failed creating auth user ${u.email}: ${createErr.message}`);
      authId = created.user.id;
    }

    const dbRole = u.role === 'manager' ? 'administrator' : u.role;
    const { error: staffErr } = await supabase
      .from('lab_staff')
      .upsert(
        {
          lab_id: lab.id,
          supabase_uid: authId,
          full_name: u.full_name,
          email: u.email,
          role: dbRole,
          is_active: true,
        },
        { onConflict: 'email' }
      );

    if (staffErr) throw new Error(`Failed upserting lab_staff ${u.email}: ${staffErr.message}`);
    console.log(`Seeded user: ${u.email}`);
  }
}

async function seedSampleTestsIfEmpty() {
  const { count, error: countError } = await supabase
    .from('test_panels')
    .select('id', { count: 'exact', head: true });

  if (countError) throw new Error(`Failed counting test_panels: ${countError.message}`);
  if ((count || 0) > 0) {
    console.log('Skipping test seed: test_panels is not empty');
    return;
  }

  const lab = await ensureDefaultLab();

  const tests = [
    { name: 'CBC', short_code: 'CBC', price: 350 },
    { name: 'Thyroid', short_code: 'THY', price: 700 },
    { name: 'Sugar', short_code: 'SUG', price: 150 },
    { name: 'LFT', short_code: 'LFT', price: 550 },
    { name: 'KFT', short_code: 'KFT', price: 500 },
    { name: 'Lipid Profile', short_code: 'LIPID', price: 650 },
  ];

  const rows = tests.map((t) => ({
    lab_id: lab.id,
    name: t.name,
    short_code: t.short_code,
    price: t.price,
    is_active: true,
  }));

  const { error } = await supabase.from('test_panels').insert(rows);
  if (error) throw new Error(`Failed seeding tests: ${error.message}`);

  console.log('Seeded default tests into test_panels');
}

async function main() {
  await seedSampleUsersIfEmpty();
  await seedSampleTestsIfEmpty();
  console.log('Enterprise seed completed');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
