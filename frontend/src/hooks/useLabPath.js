import { useAuthStore } from '../store/authStore';

/**
 * Returns a helper function `lp(path)` that prepends the current lab's
 * base path: `/lab/{slug}/{path}`.
 *
 * Usage inside any lab page/component:
 *   const lp = useLabPath();
 *   <Link to={lp('reports/new')}>       // → /lab/citydiag/reports/new
 *   <Link to={lp(`reports/${r.id}`)}>   // → /lab/citydiag/reports/abc-123
 *   navigate(lp('dashboard'));           // → /lab/citydiag/dashboard
 */
export function useLabPath() {
  const slug = useAuthStore((s) => s.slug);
  return (path) => `/lab/${slug}/${path}`;
}
