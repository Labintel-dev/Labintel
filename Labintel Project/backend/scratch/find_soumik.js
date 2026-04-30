const supabase = require('../db/supabase');

async function findSoumik() {
  console.log('Searching for "soumik" in patients...');
  const { data: patients, error: patientError } = await supabase
    .from('patients')
    .select('full_name, phone')
    .ilike('full_name', '%soumik%');

  if (patientError) {
    console.error('Patient search error:', patientError);
  } else if (patients.length > 0) {
    console.log('Found in patients:');
    patients.forEach(p => console.log(`- ${p.full_name}: ${p.phone}`));
  } else {
    console.log('No patient found with that name.');
  }

  console.log('\nSearching for "soumik" in lab_staff...');
  const { data: staff, error: staffError } = await supabase
    .from('lab_staff')
    .select('full_name, email') // lab_staff doesn't always have phone, but let's check
    .ilike('full_name', '%soumik%');

  if (staffError) {
    console.error('Staff search error:', staffError);
  } else if (staff.length > 0) {
    console.log('Found in lab_staff:');
    staff.forEach(s => console.log(`- ${s.full_name}: ${s.email}`));
  } else {
    console.log('No staff found with that name.');
  }
}

findSoumik().catch(console.error);
