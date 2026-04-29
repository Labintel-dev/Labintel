import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,   // { id, full_name, email/phone, role }
      lab: null,    // { id, slug, name, logo_url, primary_color } — null for patient
      slug: null,   // shorthand for lab.slug — used for URL routing in api.js
      isOtpSession: false, // Track if logged in via OTP (non-persisted)

      setAuth: (token, user, lab = null, isOtpSession = false) => set({ token, user, lab, slug: lab?.slug ?? null, isOtpSession }),

      clearAuth: () => set({ token: null, user: null, lab: null, slug: null, isOtpSession: false }),

      isLoggedIn: () => !!get().token,

      isPatient: () => get().user?.role === 'patient',

      hasRole: (...roles) => roles.includes(get().user?.role),

      canDo: (action) => {
        const role = get().user?.role;
        const perms = {
          registerPatient:   ['administrator', 'receptionist'],
          createReport:      ['administrator', 'technician'],
          editTestValues:    ['administrator', 'technician'],
          releaseReport:     ['administrator'],
          viewAnalytics:     ['administrator'],
          viewAlerts:        ['administrator'],
          manageStaff:       ['administrator'],
          editLabSettings:   ['administrator'],
          downloadPDF:       ['administrator', 'receptionist', 'technician'],
        };
        return (perms[action] || []).includes(role);
      },
    }),
    {
      name: 'labintel-auth',
      // Persist token, user, lab branding, and slug for routing
      // BUT never persist isOtpSession — it will be cleared on refresh
      partialize: (state) => ({ token: state.token, user: state.user, lab: state.lab, slug: state.slug }),
    }
  )
);
