import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * STAFF / ADMIN AUTH STORE
 * Persists to 'labintel-auth'
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,   // { id, full_name, email/phone, role }
      lab: null,    // { id, slug, name, logo_url, primary_color }
      slug: null,

      setAuth: (token, user, lab = null) => {
        const normalizedUser = user ? {
          ...user,
          role: (user.role === 'manager' ? 'administrator' : user.role) || 'receptionist'
        } : null;
        return set({ token, user: normalizedUser, lab, slug: lab?.slug ?? null });
      },

      clearAuth: () => set({ token: null, user: null, lab: null, slug: null }),
      isLoggedIn: () => !!get().token,
      isPatient: () => get().user?.role === 'patient',
      hasRole: (...roles) => roles.includes(get().user?.role),

      canDo: (action) => {
        const role = get().user?.role;
        const perms = {
          registerPatient:   ['administrator', 'manager', 'receptionist'],
          createReport:      ['administrator', 'manager', 'technician'],
          editTestValues:    ['administrator', 'manager', 'technician'],
          releaseReport:     ['administrator', 'manager', 'technician'],
          viewAnalytics:     ['administrator', 'manager'],
          viewAlerts:        ['administrator', 'manager'],
          manageStaff:       ['administrator', 'manager'],
          editLabSettings:   ['administrator', 'manager'],
          downloadPDF:       ['administrator', 'manager', 'receptionist', 'technician'],
        };
        return (perms[action] || []).includes(role);
      },
    }),
    {
      name: 'labintel-auth',
      partialize: (state) => ({ token: state.token, user: state.user, lab: state.lab, slug: state.slug }),
    }
  )
);

/**
 * PATIENT AUTH STORE
 * Persists to 'labintel-patient-auth'
 * Completely separate from staff/admin session.
 */
export const usePatientAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,   // { id, full_name, phone, role: 'patient' }
      
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      isLoggedIn: () => !!get().token,
    }),
    {
      name: 'labintel-patient-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
