import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

export function useApi(endpoint) {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}

export function useDashboardData() {
  const [data, setData] = useState({
    stats: [],
    labs: [],
    liveSessions: [],
    teamMembers: [],
    activityLogs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const [statsRes, labsRes, sessionsRes, teamRes, activityRes] = await Promise.all([
          fetch(`${API_URL}/stats`).then(r => r.json()),
          fetch(`${API_URL}/labs`).then(r => r.json()),
          fetch(`${API_URL}/sessions`).then(r => r.json()),
          fetch(`${API_URL}/team`).then(r => r.json()),
          fetch(`${API_URL}/activity`).then(r => r.json()),
        ]);

        // Format stats for the UI component
        const formattedStats = [
          {
            id: 1,
            label: 'ACTIVE LABS',
            value: statsRes.activeLabs || '0',
            change: 'Active on platform',
            gradient: 'linear-gradient(135deg, #0d9488 0%, #065f46 100%)',
            accent: '#14b8a6',
          },
          {
            id: 2,
            label: 'TOTAL PATIENTS',
            value: (statsRes.totalPatients || 0).toLocaleString(),
            change: 'Across all labs',
            gradient: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
            accent: '#06b6d4',
          },
          {
            id: 3,
            label: 'REPORTS TODAY',
            value: (statsRes.reportsToday || 0).toLocaleString(),
            change: 'Across all labs',
            gradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
            accent: '#a78bfa',
          },
          {
            id: 4,
            label: 'UNREAD ALERTS',
            value: statsRes.unreadAlerts || '0',
            change: 'Requires attention',
            gradient: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)',
            accent: '#f43f5e',
          },
        ];

        setData({
          stats: formattedStats,
          labs: labsRes,
          liveSessions: sessionsRes,
          teamMembers: teamRes,
          activityLogs: activityRes
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  return { ...data, loading };
}
