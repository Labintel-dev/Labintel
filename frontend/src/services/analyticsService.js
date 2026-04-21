import api from './api';

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard').then(r => r.data),
  getVolume: () => api.get('/analytics/volume').then(r => r.data),
  getPanels: () => api.get('/analytics/panels').then(r => r.data),
  getTurnaround: () => api.get('/analytics/turnaround').then(r => r.data),
};
