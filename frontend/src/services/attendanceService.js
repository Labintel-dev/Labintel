import api from './api';

export const attendanceService = {
  /** POST — mark current staff as checked in for today */
  checkIn: () =>
    api.post('/attendance/check-in').then(r => r.data),

  /** PATCH — mark current staff as checked out for today */
  checkOut: () =>
    api.patch('/attendance/check-out').then(r => r.data),

  /** GET — current staff's own attendance for this month */
  getMyAttendance: () =>
    api.get('/attendance/my').then(r => r.data),

  /**
   * GET — manager/admin: all attendance records for the lab.
   * @param {{ month?: string, role?: string, staff_id?: string }} params
   */
  getAllAttendance: (params = {}) =>
    api.get('/attendance/all', { params }).then(r => r.data),

  /**
   * GET — manager/admin: per-staff monthly summary.
   * @param {{ month?: string }} params
   */
  getSummary: (params = {}) =>
    api.get('/attendance/summary', { params }).then(r => r.data),
};
