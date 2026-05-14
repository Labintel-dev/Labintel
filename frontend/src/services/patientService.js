import api from './api';

export const patientService = {
  // Lab-side patient management
  getAll: (params) => api.get('/patients', { params }).then(r => r.data),
  getById: (id) => api.get(`/patients/${id}`).then(r => r.data),
  create: (data) => api.post('/patients', data).then(r => r.data),
  update: (id, data) => api.put(`/patients/${id}`, data).then(r => r.data),
  getReports: (id) => api.get(`/patients/${id}/reports`).then(r => r.data),
  getTrends: (id) => api.get(`/patients/${id}/trends`).then(r => r.data),
  getAlerts: (id) => api.get(`/patients/${id}/alerts`).then(r => r.data),
  resolveAlert: (id, alertId) => api.put(`/patients/${id}/alerts/${alertId}`).then(r => r.data),

  // Patient portal (self-service)
  portal: {
    getMyReports: () => api.get('/patient/reports').then(r => r.data),
    getMyReport: (id) => api.get(`/patient/reports/${id}`).then(r => r.data),
    getMyTrends: () => api.get('/patient/trends').then(r => r.data),
    getMyProfile: () => api.get('/patient/profile').then(r => r.data),
    updateMyProfile: (data) => api.put('/patient/profile', data).then(r => r.data),
    sendLinkPhoneOtp: (phone) => api.post('/patient/link-phone/send-otp', { phone }).then(r => r.data),
    verifyLinkPhoneOtp: (phone, otp) => api.post('/patient/link-phone/verify-otp', { phone, otp }).then(r => r.data),
  },
};
