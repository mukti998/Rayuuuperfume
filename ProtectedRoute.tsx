import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/gateway-7f3k1';

/**
 * Wraps every admin page. Not linked from any public nav or sitemap —
 * the only way in is knowing the exact path, then passing real
 * Supabase Auth + profiles.role = 'admin' checks (also enforced by RLS
 * server-side, so this is UX, not the actual security boundary).
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, isAdmin, loading } = useAuth();

  if (loading) return <div className="admin-loading">Checking session…</div>;
  if (!session || !isAdmin) return <Navigate to={`${ADMIN_PATH}/login`} replace />;

  return <>{children}</>;
}

export { ADMIN_PATH };
