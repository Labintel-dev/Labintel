import api from './api';

export const reportService = {
  getAll: (params) => api.get('/reports', { params }).then(r => r.data),
  getById: (id) => api.get(`/reports/${id}`).then(r => r.data),
  create: (data) => api.post('/reports', data).then(r => r.data),
  updateStatus: (id, status) => api.patch(`/reports/${id}/status`, { status }).then(r => r.data),
  getDownloadUrl: (id) => api.get(`/reports/${id}/download`).then(r => r.data),
  regenerateInsights: (id) => api.post(`/reports/${id}/insights`).then(r => r.data),
  generatePdf: (id) => api.post(`/reports/${id}/generate-pdf`).then(r => r.data),
  getShare: (token) => api.get(`/reports/share/${token}`).then(r => r.data),
};

export const authService = {
  staffLogin: (data) => api.post('/auth/staff/login', data).then(r => r.data),
  staffLogout: () => api.post('/auth/staff/logout').then(r => r.data),
  getMe: () => api.get('/auth/me').then(r => r.data),
  getLabBySlug: (slug) => api.get(`/auth/lab/${slug}`).then(r => r.data),
  sendOtp: (phone) => api.post('/auth/patient/send-otp', { phone }).then(r => r.data),
  verifyOtp: (phone, otp) => api.post('/auth/patient/verify-otp', { phone, otp }).then(r => r.data),
  verifyGoogle: (access_token) => api.post('/auth/patient/google/verify', { access_token }).then(r => r.data),
};

export const settingsService = {
  getLab: () => api.get('/settings/lab').then(r => r.data),
  updateLab: (data) => api.put('/settings/lab', data).then(r => r.data),
  getPanels: () => api.get('/settings/panels').then(r => r.data),
  createPanel: (data) => api.post('/settings/panels', data).then(r => r.data),
  updatePanel: (id, data) => api.put(`/settings/panels/${id}`, data).then(r => r.data),
  deletePanel: (id) => api.delete(`/settings/panels/${id}`).then(r => r.data),
  getStaff: () => api.get('/settings/staff').then(r => r.data),
  inviteStaff: (data) => api.post('/settings/staff/invite', data).then(r => r.data),
  updateStaff: (id, data) => api.put(`/settings/staff/${id}`, data).then(r => r.data),
};

export const alertService = {
  getAll: () => api.get('/analytics/dashboard').then(r => r.data),
};
