import { useAuthStore } from '../store/authStore';

export function usePermission() {
  const { user, canDo, hasRole } = useAuthStore();
  return { user, canDo, hasRole, role: user?.role };
}
