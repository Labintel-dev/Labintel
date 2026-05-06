'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const supabase = require('../db/supabase');
const { supabaseAuth } = require('../db/supabase');
const { sendOTP } = require('../services/sms');
const logger   = require('../logger');

// ─── Staff: Login ──────────────────────────────────────────────────────────
async function staffLogin(req, res) {
  const { email, password, slug, role } = req.body;

  let lab = null;

  // If a slug is provided, validate the lab first (lab portal flow)
  if (slug) {
    const { data: labData, error: labError } = await supabase
      .from('labs')
      .select('id, name, slug, logo_url, primary_color, is_active')
      .eq('slug', slug)
      .single();

    if (labError || !labData) {
      return res.status(404).json({ error: 'Lab not found. Check your URL.' });
    }
    if (!labData.is_active) {
      return res.status(403).json({ error: 'This lab account is inactive.' });
    }
    lab = labData;
  }

  // Sign in via Supabase Auth (use isolated auth client — not the admin client)
  const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData?.session) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  // Find staff record — scoped to the lab if slug provided, otherwise any lab
  let staffQuery = supabase
    .from('lab_staff')
    .select('id, lab_id, role, full_name, is_active')
    .eq('supabase_uid', authData.user.id);

  if (lab) {
    staffQuery = staffQuery.eq('lab_id', lab.id);
  }

  const { data: staff, error: staffError } = await staffQuery.single();

  if (staffError || !staff) {
    await supabaseAuth.auth.signOut();
    return res.status(403).json({ error: 'No staff account found for this email.' });
  }

  if (!staff.is_active) {
    return res.status(403).json({ error: 'Your account has been deactivated. Contact your administrator.' });
  }

  // Role selector support on login form: keep manager/admin backward compatible.
  const normalizeRole = (value) => (value === 'manager' ? 'administrator' : value);
  if (role && normalizeRole(staff.role) !== normalizeRole(role)) {
    await supabaseAuth.auth.signOut();
    return res.status(403).json({ error: `This account is not registered as ${role}. Please choose the correct role.` });
  }

  // If no slug was given, load the lab from the staff's lab_id
  if (!lab) {
    const { data: staffLab } = await supabase
      .from('labs')
      .select('id, name, slug, logo_url, primary_color')
      .eq('id', staff.lab_id)
      .single();
    lab = staffLab;
  }

  logger.info(`Staff login: ${email} → lab ${lab?.slug || 'unknown'}`);

  return res.json({
    token: authData.session.access_token,
    user:  {
      id:        staff.id,
      full_name: staff.full_name,
      email,
      role:      staff.role,
    },
    lab: lab ? {
      id:            lab.id,
      name:          lab.name,
      slug:          lab.slug,
      logo_url:      lab.logo_url,
      primary_color: lab.primary_color,
    } : null,
  });
}

// ─── Staff: Logout ─────────────────────────────────────────────────────────
async function staffLogout(req, res) {
  await supabase.auth.signOut();
  return res.json({ message: 'Logged out successfully.' });
}

// ─── Staff: Get current user ───────────────────────────────────────────────
async function getMe(req, res) {
  const { data: lab } = await supabase
    .from('labs')
    .select('id, name, slug, logo_url, primary_color, address, phone')
    .eq('id', req.user.lab_id)
    .single();

  return res.json({
    user: {
      id:        req.user.id,
      full_name: req.user.full_name,
      role:      req.user.role,
      lab_id:    req.user.lab_id,
    },
    lab,
  });
}

// ─── Public: Get lab branding by slug ─────────────────────────────────────
async function getLabBySlug(req, res) {
  const { slug } = req.params;

  const { data: lab, error } = await supabase
    .from('labs')
    .select('name, slug, logo_url, primary_color, is_active')
    .eq('slug', slug)
    .single();

  if (error || !lab) {
    return res.status(404).json({ error: 'Lab not found.' });
  }

  return res.json({ data: lab });
}

// ─── Patient: Send OTP ────────────────────────────────────────────────────
async function sendOtpHandler(req, res) {
  const { phone } = req.body;
  const isDev = process.env.NODE_ENV !== 'production';

  // In dev mode, always use fixed OTP '123456' — no SMS sent
  const otp = isDev ? '123456' : String(Math.floor(100000 + Math.random() * 900000));
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Upsert — if phone already has a session, replace it
  const { error } = await supabase.from('otp_sessions').upsert(
    {
      phone,
      hashed_otp: hashedOtp,
      expires_at: expiresAt.toISOString(),
      attempts:   0,
    },
    { onConflict: 'phone' }
  );

  if (error) {
    logger.error(`Failed to create OTP session for ${phone}: ${error.message}`);
    return res.status(500).json({ error: 'Could not create OTP session. Try again.' });
  }

  if (isDev) {
    // DEV MODE: Log OTP to console instead of sending SMS
    logger.info(`[DEV OTP] Phone: ${phone} → OTP: ${otp}`);
    console.log(`\n  🔑 DEV OTP for ${phone}: ${otp}\n`);
  } else {
    // Production: send real SMS
    sendOTP(phone, otp);
    logger.info(`OTP sent to ${phone}`);
  }

  return res.json({
    message: isDev
      ? 'OTP sent! (Dev mode: use 123456)'
      : 'OTP sent successfully. Valid for 5 minutes.',
  });
}

// ─── Patient: Verify OTP ──────────────────────────────────────────────────
async function verifyOtpHandler(req, res) {
  const { phone, otp } = req.body;

  const { data: session, error: sessionError } = await supabase
    .from('otp_sessions')
    .select('*')
    .eq('phone', phone)
    .single();

  if (sessionError || !session) {
    return res.status(404).json({ error: 'No OTP session found. Please request a new OTP.' });
  }

  // Check expiry
  if (new Date() > new Date(session.expires_at)) {
    await supabase.from('otp_sessions').delete().eq('phone', phone);
    return res.status(410).json({ error: 'OTP has expired. Please request a new one.' });
  }

  // Check max attempts
  if (session.attempts >= 3) {
    await supabase.from('otp_sessions').delete().eq('phone', phone);
    return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
  }

  // Verify OTP hash
  const isValid = await bcrypt.compare(otp, session.hashed_otp);
  if (!isValid) {
    // Increment attempts
    await supabase
      .from('otp_sessions')
      .update({ attempts: session.attempts + 1 })
      .eq('phone', phone);
    const remaining = 2 - session.attempts;
    return res.status(401).json({ error: `Incorrect OTP. ${remaining} attempt(s) remaining.` });
  }

  // OTP is correct — delete session immediately
  await supabase.from('otp_sessions').delete().eq('phone', phone);

  // Find or create patient record
  let { data: patient } = await supabase
    .from('patients')
    .select('id, phone, full_name')
    .eq('phone', phone)
    .single();

  if (!patient) {
    const { data: newPatient, error: createError } = await supabase
      .from('patients')
      .insert({ phone })
      .select()
      .single();

    if (createError) {
      return res.status(500).json({ error: 'Failed to create patient record.' });
    }
    patient = newPatient;
  }

  // Sign patient JWT (30-day expiry)
  const token = jwt.sign(
    { patient_id: patient.id, phone: patient.phone, role: 'patient' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  logger.info(`Patient login: ${phone}`);
  return res.json({
    token,
    patient: { id: patient.id, phone: patient.phone, full_name: patient.full_name },
  });
}

// ─── Patient: Redirect to Google OAuth ──────────────────────────────────
async function googleRedirect(req, res) {
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
    },
  });

  if (error || !data.url) {
    logger.error('googleRedirect err: ' + error?.message);
    return res.status(500).json({ error: 'Failed to initiate Google Login' });
  }

  // Redirect the browser to Supabase Google OAuth
  res.redirect(data.url);
}

// ─── Patient: Verify Google OAuth Token ───────────────────────────────────
async function verifyGooglePatient(req, res) {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: 'Missing access_token' });

  // 1. Verify the Supabase token
  const { data: { user }, error } = await supabaseAuth.auth.getUser(access_token);
  if (error || !user) {
    logger.error('verifyGooglePatient: ' + error?.message);
    return res.status(401).json({ error: 'Invalid Google session' });
  }

  const email = user.email;
  const fullName = user.user_metadata?.full_name || user.email.split('@')[0];

  // 2. Find or create patient record by email
  let { data: patient } = await supabase
    .from('patients')
    .select('id, email, phone, full_name')
    .eq('email', email)
    .single();

  if (!patient) {
    const { data: newPatient, error: createError } = await supabase
      .from('patients')
      .insert({ email, full_name: fullName })
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
         // Rare race condition, retry fetch
         const { data: retryPatient } = await supabase.from('patients').select('id, email, phone, full_name').eq('email', email).single();
         patient = retryPatient;
      } else {
         logger.error('verifyGooglePatient create err: ' + createError.message);
         return res.status(500).json({ error: 'Failed to create patient record.' });
      }
    } else {
      patient = newPatient;
    }
  }

  // 3. Sign LabIntel JWT (30-day expiry)
  const token = jwt.sign(
    { patient_id: patient.id, phone: patient.phone, email: patient.email, role: 'patient' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  logger.info(`Patient Google login: ${email}`);
  return res.json({
    token,
    patient: { id: patient.id, email: patient.email, phone: patient.phone, full_name: patient.full_name },
  });
}

// ─── Patient: Self-registration ────────────────────────────────────────────
async function registerPatient(req, res) {
  const { phone, full_name, date_of_birth, gender } = req.body;

  if (!phone || !full_name) {
    return res.status(400).json({ error: 'Phone and full_name are required.' });
  }

  try {
    // Check if patient already exists
    let { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('phone', phone)
      .single();

    if (existingPatient) {
      return res.status(409).json({
        error: 'Patient with this phone number already registered.',
        data: { patient: existingPatient },
      });
    }

    // Create new patient record
    const { data: newPatient, error: createError } = await supabase
      .from('patients')
      .insert({
        phone,
        full_name,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
      })
      .select()
      .single();

    if (createError) {
      logger.error(`Failed to create patient: ${createError.message}`);
      return res.status(500).json({ error: 'Failed to create patient record.' });
    }

    logger.info(`Patient self-registered: ${phone}`);
    return res.status(201).json({
      message: 'Registration successful. You can now log in with OTP or Google.',
      data: { patient: newPatient },
    });
  } catch (err) {
    logger.error(`Patient registration error: ${err.message}`);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

// ─── Patient: Profile Sync ────────────────────────────────────────────────
async function getProfile(req, res) {
  const patient_id = req.user.patient_id;
  const { data, error } = await supabase.from('patients').select('*').eq('id', patient_id).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
}

async function upsertProfile(req, res) {
  const patient_id = req.user.patient_id;
  const { full_name, phone, dob, email, gender } = req.body;
  
  // Use data from JWT if not in body
  const finalPhone = phone || req.user.phone;
  const finalEmail = email || req.user.email;

  const { data, error } = await supabase
    .from('patients')
    .upsert({
      id: patient_id,
      full_name,
      phone: finalPhone,
      date_of_birth: dob || null,
      email: finalEmail,
      gender: gender || null
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    logger.error(`upsertProfile error: ${error.message}`);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
  return res.json({ data });
}

module.exports = {
  staffLogin,
  staffLogout,
  getMe,
  getLabBySlug,
  sendOtpHandler,
  verifyOtpHandler,
  googleRedirect,
  verifyGooglePatient,
  registerPatient,
  getProfile,
  upsertProfile,
};
