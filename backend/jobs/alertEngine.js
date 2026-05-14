'use strict';
/**
 * alertEngine.js — Nightly cron job (11 PM IST).
 * Three independent health alert checks run in sequence.
 *
 * Manual run: node -e "require('./jobs/alertEngine').run()"
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const supabase = require('../db/supabase');
const logger   = require('../logger');

// Guard: do not create a duplicate unread alert for same patient+parameter+type
async function alertExists(patient_id, parameter_id, alert_type) {
  const { data } = await supabase
    .from('health_alerts')
    .select('id')
    .eq('patient_id', patient_id)
    .eq('parameter_id', parameter_id)
    .eq('alert_type', alert_type)
    .eq('is_read', false)
    .maybeSingle();
  return !!data;
}

async function insertAlert(lab_id, patient_id, parameter_id, alert_type, message) {
  if (await alertExists(patient_id, parameter_id, alert_type)) {
    logger.debug(`Alert already exists — skipping: ${alert_type} for patient ${patient_id}`);
    return;
  }
  const { error } = await supabase.from('health_alerts').insert({
    lab_id, patient_id, parameter_id, alert_type, message,
  });
  if (error) {
    logger.error(`Failed to insert alert ${alert_type}: ${error.message}`);
  } else {
    logger.info(`Alert created: ${alert_type} for patient ${patient_id}`);
  }
}

// ── Check 1: Critical values in the last 24 hours ─────────────────────────
async function checkCriticalValues() {
  logger.info('Alert Check 1: Critical values...');
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { data: criticalValues, error } = await supabase
    .from('test_values')
    .select(`
      value, flag, parameter_id,
      test_parameters ( id, name, unit ),
      reports!inner ( id, lab_id, patient_id, collected_at, status )
    `)
    .in('flag', ['critical_low', 'critical_high'])
    .eq('reports.status', 'released')
    .gte('reports.collected_at', since);

  if (error) {
    logger.error(`Check 1 query failed: ${error.message}`);
    return;
  }

  let alertCount = 0;
  for (const tv of criticalValues || []) {
    const { lab_id, patient_id } = tv.reports;
    const paramName  = tv.test_parameters?.name || 'Unknown parameter';
    const flagLabel  = tv.flag === 'critical_low' ? 'critically LOW' : 'critically HIGH';
    const message    = `Critical alert: ${paramName} is ${flagLabel} (value: ${tv.value} ${tv.test_parameters?.unit || ''}) — immediate attention required.`;

    await insertAlert(lab_id, patient_id, tv.parameter_id, 'critical_value', message);
    alertCount++;
  }
  logger.info(`Check 1 done: ${alertCount} potential critical alerts processed`);
}

// ── Check 2: Worsening trend (last 3 values all abnormal, moving away from normal) ──
async function checkWorseningTrend() {
  logger.info('Alert Check 2: Worsening trends...');

  // Get distinct patient+parameter combos with abnormal values in released reports
  const { data: combos, error } = await supabase
    .from('test_values')
    .select(`
      parameter_id,
      test_parameters ( id, name, unit, ref_min_male, ref_max_male, ref_min_female, ref_max_female ),
      reports!inner ( lab_id, patient_id, collected_at, status )
    `)
    .in('flag', ['low', 'high', 'critical_low', 'critical_high'])
    .eq('reports.status', 'released')
    .order('reports.collected_at', { ascending: false });

  if (error) {
    logger.error(`Check 2 query failed: ${error.message}`);
    return;
  }

  // Group by patient+parameter
  const grouped = {};
  for (const tv of combos || []) {
    const key = `${tv.reports.patient_id}::${tv.parameter_id}`;
    if (!grouped[key]) {
      grouped[key] = {
        lab_id:      tv.reports.lab_id,
        patient_id:  tv.reports.patient_id,
        parameter:   tv.test_parameters,
        parameter_id: tv.parameter_id,
      };
    }
  }

  let alertCount = 0;
  for (const [, group] of Object.entries(grouped)) {
    // Fetch last 3 values for this patient+parameter
    const { data: last3 } = await supabase
      .from('test_values')
      .select('value, flag, reports!inner ( collected_at, patient_id, status )')
      .eq('parameter_id', group.parameter_id)
      .eq('reports.patient_id', group.patient_id)
      .eq('reports.status', 'released')
      .in('flag', ['low', 'high', 'critical_low', 'critical_high'])
      .order('reports.collected_at', { ascending: false })
      .limit(3);

    if (!last3 || last3.length < 3) continue;

    // All 3 must be abnormal — already filtered by flag
    // Check if trend is consistently getting worse (values moving further from normal)
    const p       = group.parameter;
    const refMid  = p ? ((p.ref_min_male || 0) + (p.ref_max_male || 0)) / 2 : null;
    if (refMid === null) continue;

    const distances = last3.map(v => Math.abs(v.value - refMid));
    const isWorsening = distances[0] > distances[1] && distances[1] > distances[2];

    if (isWorsening) {
      const message = `Worsening trend: ${p?.name || 'Unknown'} has been abnormal and deteriorating across the last 3 reports. Values: ${last3.map(v => v.value).join(' → ')}.`;
      await insertAlert(group.lab_id, group.patient_id, group.parameter_id, 'worsening_trend', message);
      alertCount++;
    }
  }
  logger.info(`Check 2 done: ${alertCount} worsening trend alerts created`);
}

// ── Check 3: Persistent abnormal (3+ of last 4 reports flagged for same parameter) ──
async function checkPersistentAbnormal() {
  logger.info('Alert Check 3: Persistent abnormals...');

  const { data: recentValues, error } = await supabase
    .from('test_values')
    .select(`
      parameter_id, flag,
      test_parameters ( id, name, unit ),
      reports!inner ( lab_id, patient_id, collected_at, status )
    `)
    .not('flag', 'eq', 'normal')
    .eq('reports.status', 'released')
    .order('reports.collected_at', { ascending: false });

  if (error) {
    logger.error(`Check 3 query failed: ${error.message}`);
    return;
  }

  // Group by patient+parameter
  const grouped = {};
  for (const tv of recentValues || []) {
    const key = `${tv.reports.patient_id}::${tv.parameter_id}`;
    if (!grouped[key]) {
      grouped[key] = {
        lab_id:       tv.reports.lab_id,
        patient_id:   tv.reports.patient_id,
        parameter_id: tv.parameter_id,
        parameter:    tv.test_parameters,
        flags:        [],
      };
    }
    grouped[key].flags.push(tv.flag);
  }

  let alertCount = 0;
  for (const [, group] of Object.entries(grouped)) {
    // Take only last 4 occurrences
    const last4 = group.flags.slice(0, 4);
    if (last4.length < 4) continue;

    const abnormalCount = last4.filter(f => f !== 'normal').length;
    if (abnormalCount >= 3) {
      const paramName = group.parameter?.name || 'Unknown';
      const message   = `Persistent abnormal: ${paramName} has been outside normal range in ${abnormalCount} of the last ${last4.length} reports. Continued monitoring recommended.`;
      await insertAlert(group.lab_id, group.patient_id, group.parameter_id, 'persistent_abnormal', message);
      alertCount++;
    }
  }
  logger.info(`Check 3 done: ${alertCount} persistent abnormal alerts created`);
}

// ── Main runner ────────────────────────────────────────────────────────────
async function run() {
  logger.info('═══ Alert Engine Starting ═══');
  await checkCriticalValues();
  await checkWorseningTrend();
  await checkPersistentAbnormal();
  logger.info('═══ Alert Engine Complete ═══');
}

module.exports = { run };

// Allow direct execution
if (require.main === module) {
  run().then(() => process.exit(0)).catch(err => {
    logger.error(err.message);
    process.exit(1);
  });
}
