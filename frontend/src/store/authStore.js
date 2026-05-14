import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,   // { id, full_name, email/phone, role }
      lab: null,    // { id, slug, name, logo_url, primary_color } — null for patient
      slug: null,   // shorthand for lab.slug — used for URL routing in api.js

      setAuth: (token, user, lab = null) => {
        // Normalize role for consistency: 'manager' -> 'administrator'
        const normalizedUser = user ? {
          ...user,
          role: (user.role === 'manager' ? 'administrator' : user.role) || 'receptionist'
        } : null;
        return set({ token, user: normalizedUser, lab, slug: lab?.slug ?? null });
      },

      clearAuth: () => set({ token: null, user: null, lab: null, slug: null }),

      isLoggedIn: () => !!get().token,

      isPatient: () => get().user?.role === 'patient',

      hasRole: (...roles) => {
        const role = get().user?.role;
        return roles.includes(role);
      },

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
      // Persist token, user, lab branding, and slug for routing
      partialize: (state) => ({ token: state.token, user: state.user, lab: state.lab, slug: state.slug }),
    }
  )
);
