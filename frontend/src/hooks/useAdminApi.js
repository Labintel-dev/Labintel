import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
const ADMIN_API = `${API_BASE}/admin`;

/* ─────────────────────────────────────────────────────────────────────────
   Generic GET hook
───────────────────────────────────────────────────────────────────────── */
export function useApi(endpoint) {
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`${ADMIN_API}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(Array.isArray(json) ? json : []);
      } catch (err) {
        if (!cancelled) { setError(err.message); setData([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [endpoint, refreshKey]);

  return { data, loading, error, refetch };
}

/* ─────────────────────────────────────────────────────────────────────────
   Mutate helper (POST / PUT / DELETE)
───────────────────────────────────────────────────────────────────────── */
export async function mutateApi(endpoint, method = 'POST', body = null) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${ADMIN_API}${endpoint}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

/* ─────────────────────────────────────────────────────────────────────────
   Dashboard composite hook
───────────────────────────────────────────────────────────────────────── */
export function useDashboardData() {
  const [data, setData]       = useState({ stats: [], labs: [], liveSessions: [], activityLogs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      try {
        setLoading(true);
        const [statsRaw, labsRaw, sessionsRaw, activityRaw] = await Promise.all([
          fetch(`${ADMIN_API}/stats`).then(r   => r.json()),
          fetch(`${ADMIN_API}/labs`).then(r    => r.json()),
          fetch(`${ADMIN_API}/sessions`).then(r => r.json()),
          fetch(`${ADMIN_API}/activity`).then(r => r.json()),
        ]);

        if (cancelled) return;

        const formattedStats = [
          {
            id: 1, label: 'ACTIVE LABS',
            value: (statsRaw.activeLabs ?? 0).toString(),
            change: 'Active on platform',
            gradient: 'linear-gradient(135deg, #0d9488 0%, #065f46 100%)',
            accent: '#14b8a6',
          },
          {
            id: 2, label: 'TOTAL PATIENTS',
            value: (statsRaw.totalPatients ?? 0).toLocaleString(),
            change: 'Across all labs',
            gradient: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
            accent: '#06b6d4',
          },
          {
            id: 3, label: 'REPORTS TODAY',
            value: (statsRaw.reportsToday ?? 0).toLocaleString(),
            change: 'Across all labs',
            gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
            accent: '#a78bfa',
          },
          {
            id: 4, label: 'UNREAD ALERTS',
            value: (statsRaw.unreadAlerts ?? 0).toString(),
            change: 'Requires attention',
            gradient: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)',
            accent: '#f43f5e',
          },
        ];

        setData({
          stats:        formattedStats,
          labs:         Array.isArray(labsRaw)      ? labsRaw      : [],
          liveSessions: Array.isArray(sessionsRaw)  ? sessionsRaw  : [],
          activityLogs: Array.isArray(activityRaw)  ? activityRaw  : [],
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  return { ...data, loading, error };
}
