import { useAuthStore } from '../store/authStore';
import { calcAge } from '../utils/formatDate';

export function usePatient() {
  const user = useAuthStore((s) => s.user);

  const getAge = (dob) => calcAge(dob);

  return { user, getAge };
}
