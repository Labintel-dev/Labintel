import { useAuthStore } from '../store/authStore';

export function useLabContext() {
  const lab = useAuthStore((s) => s.lab);
  const user = useAuthStore((s) => s.user);

  return {
    lab,
    slug: lab?.slug,
    primaryColor: lab?.primary_color || '#0d9488',
    labName: lab?.name || 'LabIntel',
    logoUrl: lab?.logo_url,
    role: user?.role,
  };
}
