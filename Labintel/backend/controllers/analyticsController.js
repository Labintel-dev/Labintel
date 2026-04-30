'use strict';
const supabase = require('../db/supabase');

// ─── Dashboard — 4 KPIs via Promise.all ───────────────────────────────────
async function getDashboard(req, res) {
  const lab_id = req.user.lab_id;
  const now    = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const today  = new Date(now.setHours(0, 0, 0, 0)).toISOString();

  const [
    { count: patientsThisMonth },
    { count: reportsToday },
    { count: pendingReports },
    { count: unreadAlerts },
  ] = await Promise.all([
    supabase
      .from('lab_patients')
      .select('*', { count: 'exact', head: true })
      .eq('lab_id', lab_id)
      .gte('registered_at', startOfMonth),

    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('lab_id', lab_id)
      .gte('created_at', today),

    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('lab_id', lab_id)
      .in('status', ['draft', 'in_review']),

    supabase
      .from('health_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('lab_id', lab_id)
      .eq('is_read', false),
  ]);

  return res.json({
    data: {
      patients_this_month: patientsThisMonth || 0,
      reports_today:       reportsToday      || 0,
      pending_reports:     pendingReports     || 0,
      unread_alerts:       unreadAlerts       || 0,
    },
  });
}

// ─── Daily report volume — last 30 days (bar chart) ───────────────────────
async function getVolume(req, res) {
  const lab_id = req.user.lab_id;

  const { data, error } = await supabase.rpc('get_report_volume', { p_lab_id: lab_id });

  if (error) {
    // Fallback: JS-side aggregation if RPC not available
    const { data: reports } = await supabase
      .from('reports')
      .select('created_at')
      .eq('lab_id', lab_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
      .order('created_at', { ascending: true });

    const grouped = {};
    (reports || []).forEach(r => {
      const date = r.created_at.substring(0, 10);
      grouped[date] = (grouped[date] || 0) + 1;
    });
    const result = Object.entries(grouped).map(([date, count]) => ({ date, count }));
    return res.json({ data: result });
  }

  return res.json({ data });
}

// ─── Panel distribution — last 30 days (pie chart) ────────────────────────
async function getPanels(req, res) {
  const lab_id = req.user.lab_id;
  const since  = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: reports, error } = await supabase
    .from('reports')
    .select('panel_id, test_panels ( name, short_code )')
    .eq('lab_id', lab_id)
    .gte('created_at', since);

  if (error) return res.status(500).json({ error: error.message });

  // Group by panel
  const grouped = {};
  for (const r of reports || []) {
    const key = r.panel_id;
    if (!grouped[key]) {
      grouped[key] = {
        panel_id:   key,
        name:       r.test_panels?.name || 'Unknown',
        short_code: r.test_panels?.short_code || '',
        count:      0,
      };
    }
    grouped[key].count++;
  }

  const result = Object.values(grouped).sort((a, b) => b.count - a.count);
  return res.json({ data: result });
}

// ─── Average turnaround time (draft → released) in hours ──────────────────
async function getTurnaround(req, res) {
  const lab_id = req.user.lab_id;

  const { data: reports, error } = await supabase
    .from('reports')
    .select('created_at, reported_at')
    .eq('lab_id', lab_id)
    .eq('status', 'released')
    .not('reported_at', 'is', null)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());

  if (error) return res.status(500).json({ error: error.message });

  if (!reports || reports.length === 0) {
    return res.json({ data: { average_hours: null, count: 0 } });
  }

  const totalMs = reports.reduce((sum, r) => {
    return sum + (new Date(r.reported_at) - new Date(r.created_at));
  }, 0);

  const avgHours = (totalMs / reports.length) / (1000 * 3600);
  return res.json({ data: { average_hours: Math.round(avgHours * 10) / 10, count: reports.length } });
}

module.exports = { getDashboard, getVolume, getPanels, getTurnaround };
