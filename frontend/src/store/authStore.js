import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,   // { id, full_name, email/phone, role }
      lab: null,    // { id, slug, name, logo_url, primary_color } — null for patient
      slug: null,   // shorthand for lab.slug — used for URL routing in api.js

      setAuth: (token, user, lab = null) => set({ token, user, lab, slug: lab?.slug ?? null }),

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
          registerPatient:   ['manager', 'receptionist'],
          createReport:      ['manager', 'technician'],
          editTestValues:    ['manager', 'technician'],
          releaseReport:     ['manager'],
          viewAnalytics:     ['manager'],
          viewAlerts:        ['manager'],
          manageStaff:       ['manager'],
          editLabSettings:   ['manager'],
          downloadPDF:       ['manager', 'receptionist', 'technician'],
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
