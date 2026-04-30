'use strict';
const supabase = require('../db/supabase');
const logger   = require('../logger');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns { start, end } for the given month string 'YYYY-MM', or current month. */
function getMonthRange(monthParam) {
  let year, month;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    [year, month] = monthParam.split('-').map(Number);
  } else {
    const now = new Date();
    year  = now.getFullYear();
    month = now.getMonth() + 1; // 1-indexed
  }
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)); // last ms of month
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Formats today's date as YYYY-MM-DD in local server time. */
function todayDate() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

// ── checkIn ───────────────────────────────────────────────────────────────────
/**
 * POST /api/v1/attendance/check-in
 * Staff marks themselves present for today. 409 if already checked in today.
 */
async function checkIn(req, res) {
  const staff_id = req.user.id;
  const lab_id   = req.user.lab_id;
  const today    = todayDate();

  try {
    // Guard: prevent duplicate entry for the same day
    const { data: existing } = await supabase
      .from('staff_attendance')
      .select('id, check_in')
      .eq('staff_id', staff_id)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        error: 'You have already checked in today.',
        data:  { check_in: existing.check_in },
      });
    }

    const { data, error } = await supabase
      .from('staff_attendance')
      .insert({
        staff_id,
        lab_id,
        date:     today,
        check_in: new Date().toISOString(),
        status:   'present',
      })
      .select()
      .single();

    if (error) {
      // Handle unique-constraint race condition
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Already checked in today.' });
      }
      logger.error(`checkIn insert error: ${error.message}`);
      return res.status(500).json({ error: 'Failed to record check-in.' });
    }

    logger.info(`Check-in: staff ${staff_id} at ${data.check_in}`);
    return res.status(201).json({ message: 'Check-in recorded successfully.', data });
  } catch (err) {
    logger.error(`checkIn unexpected error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ── checkOut ──────────────────────────────────────────────────────────────────
/**
 * PATCH /api/v1/attendance/check-out
 * Staff updates their own today's attendance row with check_out = NOW().
 */
async function checkOut(req, res) {
  const staff_id = req.user.id;
  const today    = todayDate();

  try {
    const { data: existing } = await supabase
      .from('staff_attendance')
      .select('id, check_out')
      .eq('staff_id', staff_id)
      .eq('date', today)
      .maybeSingle();

    if (!existing) {
      return res.status(404).json({ error: 'No check-in record found for today. Please check in first.' });
    }
    if (existing.check_out) {
      return res.status(409).json({ error: 'You have already checked out today.' });
    }

    const check_out = new Date().toISOString();
    const { data, error } = await supabase
      .from('staff_attendance')
      .update({ check_out })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      logger.error(`checkOut update error: ${error.message}`);
      return res.status(500).json({ error: 'Failed to record check-out.' });
    }

    logger.info(`Check-out: staff ${staff_id} at ${check_out}`);
    return res.json({ message: 'Check-out recorded successfully.', data });
  } catch (err) {
    logger.error(`checkOut unexpected error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ── getMyAttendance ───────────────────────────────────────────────────────────
/**
 * GET /api/v1/attendance/my
 * Returns the calling staff's attendance for the current month.
 */
async function getMyAttendance(req, res) {
  const staff_id = req.user.id;
  const { start, end } = getMonthRange(); // always current month

  try {
    const { data, error } = await supabase
      .from('staff_attendance')
      .select('id, date, check_in, check_out, status, notes')
      .eq('staff_id', staff_id)
      .gte('date', start.substring(0, 10)) // compare date only (YYYY-MM-DD)
      .lte('date', end.substring(0, 10))
      .order('date', { ascending: false });

    if (error) {
      logger.error(`getMyAttendance error: ${error.message}`);
      return res.status(500).json({ error: 'Failed to load your attendance.' });
    }

    // Compute per-record shift duration in minutes
    const records = (data || []).map(r => ({
      ...r,
      shift_duration_minutes: (r.check_in && r.check_out)
        ? Math.round((new Date(r.check_out) - new Date(r.check_in)) / 60000)
        : null,
    }));

    // Quick personal summary for the current month
    const totalPresent  = records.filter(r => r.status === 'present').length;
    const totalHalfDay  = records.filter(r => r.status === 'half_day').length;
    const totalAbsent   = records.filter(r => r.status === 'absent').length;
    const totalRecorded = records.length;

    return res.json({
      data: {
        records,
        summary: {
          total_present:   totalPresent,
          total_half_day:  totalHalfDay,
          total_absent:    totalAbsent,
          total_recorded:  totalRecorded,
        },
      },
    });
  } catch (err) {
    logger.error(`getMyAttendance unexpected: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ── getAllAttendance ──────────────────────────────────────────────────────────
/**
 * GET /api/v1/attendance/all
 * Manager/admin: returns all staff attendance for the lab.
 * Query params: ?month=YYYY-MM, ?role=receptionist|technician|all, ?staff_id=UUID
 */
async function getAllAttendance(req, res) {
  const lab_id          = req.user.lab_id;
  const { month, role, staff_id } = req.query;
  const { start, end }  = getMonthRange(month);

  try {
    let query = supabase
      .from('staff_attendance')
      .select(`
        id, date, check_in, check_out, status, notes, created_at,
        lab_staff ( id, full_name, role )
      `)
      .eq('lab_id', lab_id)
      .gte('date', start.substring(0, 10))
      .lte('date', end.substring(0, 10))
      .order('date', { ascending: false })
      .order('check_in', { ascending: false });

    // Optional staff_id filter
    if (staff_id) {
      query = query.eq('staff_id', staff_id);
    }

    const { data, error } = await query;

    if (error) {
      logger.error(`getAllAttendance error: ${error.message}`);
      return res.status(500).json({ error: 'Failed to load attendance records.' });
    }

    // Filter by role in JS (avoids complex nested filter syntax)
    let records = (data || []).map(r => ({
      id:                    r.id,
      staff_id:              r.lab_staff?.id,
      full_name:             r.lab_staff?.full_name,
      role:                  r.lab_staff?.role,
      date:                  r.date,
      check_in:              r.check_in,
      check_out:             r.check_out,
      status:                r.status,
      notes:                 r.notes,
      shift_duration_minutes: (r.check_in && r.check_out)
        ? Math.round((new Date(r.check_out) - new Date(r.check_in)) / 60000)
        : null,
    }));

    if (role && role !== 'all') {
      records = records.filter(r => r.role === role);
    }

    return res.json({ data: records });
  } catch (err) {
    logger.error(`getAllAttendance unexpected: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ── getSummary ────────────────────────────────────────────────────────────────
/**
 * GET /api/v1/attendance/summary
 * Manager/admin: per-staff summary for the given month.
 * Query params: ?month=YYYY-MM
 */
async function getSummary(req, res) {
  const lab_id         = req.user.lab_id;
  const { month }      = req.query;
  const { start, end } = getMonthRange(month);

  try {
    // Fetch all staff in the lab (active)
    const { data: staffList, error: staffError } = await supabase
      .from('lab_staff')
      .select('id, full_name, role')
      .eq('lab_id', lab_id)
      .eq('is_active', true)
      .in('role', ['receptionist', 'technician']); // only track-able roles

    if (staffError) {
      logger.error(`getSummary staff query error: ${staffError.message}`);
      return res.status(500).json({ error: 'Failed to load staff list.' });
    }

    // Fetch all attendance records for the month
    const { data: records, error: recError } = await supabase
      .from('staff_attendance')
      .select('staff_id, status, check_in, check_out')
      .eq('lab_id', lab_id)
      .gte('date', start.substring(0, 10))
      .lte('date', end.substring(0, 10));

    if (recError) {
      logger.error(`getSummary records error: ${recError.message}`);
      return res.status(500).json({ error: 'Failed to load attendance data.' });
    }

    // Group records by staff_id
    const byStaff = {};
    (records || []).forEach(r => {
      if (!byStaff[r.staff_id]) byStaff[r.staff_id] = [];
      byStaff[r.staff_id].push(r);
    });

    // Calculate total working days in the month
    const startDate = new Date(start);
    const endDate   = new Date(end);
    const today     = new Date();
    const effectiveEnd = endDate < today ? endDate : today;
    const totalDays = Math.ceil((effectiveEnd - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Build per-staff summary
    const summary = (staffList || []).map(staff => {
      const recs       = byStaff[staff.id] || [];
      const present    = recs.filter(r => r.status === 'present').length;
      const halfDay    = recs.filter(r => r.status === 'half_day').length;
      const absent     = recs.filter(r => r.status === 'absent').length;

      // Effective present = present + (half_day × 0.5)
      const effectiveDays  = present + halfDay * 0.5;
      const attendancePct  = totalDays > 0
        ? Math.round((effectiveDays / totalDays) * 100)
        : 0;

      // Average shift in minutes (only completed shifts)
      const completedShifts = recs.filter(r => r.check_in && r.check_out);
      const avgShiftMinutes = completedShifts.length > 0
        ? Math.round(
            completedShifts.reduce((sum, r) =>
              sum + (new Date(r.check_out) - new Date(r.check_in)) / 60000, 0
            ) / completedShifts.length
          )
        : null;

      return {
        staff_id:             staff.id,
        full_name:            staff.full_name,
        role:                 staff.role,
        total_present:        present,
        total_half_day:       halfDay,
        total_absent:         absent,
        attendance_percentage: attendancePct,
        avg_shift_minutes:    avgShiftMinutes,
      };
    });

    return res.json({ data: summary, meta: { month: month || null, total_days: totalDays } });
  } catch (err) {
    logger.error(`getSummary unexpected: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { checkIn, checkOut, getMyAttendance, getAllAttendance, getSummary };
