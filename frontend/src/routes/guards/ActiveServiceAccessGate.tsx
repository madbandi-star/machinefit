import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  isActiveServiceAccessEnforced,
  isActiveServiceUsername,
} from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useAuthStore } from '@/store/auth.store';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';

function isAccessExemptPath(pathname: string): boolean {
  if (pathname === ROUTES.UNDER_CONSTRUCTION) return true;
  if (pathname === ROUTES.LOGIN) return true;
  if (pathname === ROUTES.AUTH_TERMS) return true;
  if (pathname === ROUTES.AUTH_SIGNUP_COMPLETE) return true;
  if (pathname === ROUTES.TERMS || pathname === ROUTES.PRIVACY) return true;
  if (pathname.startsWith('/legal')) return true;
  if (pathname === ROUTES.REFUND) return true;
  if (pathname === ROUTES.LOCATION_POLICY) return true;
  if (pathname === ROUTES.COMMUNITY_POLICY) return true;
  if (pathname === ROUTES.COPYRIGHT_POLICY) return true;
  if (pathname === ROUTES.LEGAL_SECURITY) return true;
  return false;
}

/** Soft-launch: authenticated users outside the username allowlist → construction page. */
export function ActiveServiceAccessGate() {
  const hydrated = useAuthHydration();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const enforced = isActiveServiceAccessEnforced(
    import.meta.env.VITE_ACTIVE_SERVICE_ACCESS as string | undefined
  );

  if (!enforced) {
    return <Outlet />;
  }

  if (!hydrated) {
    return (
      <div className="auth-guard-loading" aria-busy="true" aria-live="polite">
        <Skeleton count={2} height={72} />
      </div>
    );
  }

  if (
    isAuthenticated &&
    user &&
    !isActiveServiceUsername(user.displayName) &&
    !isAccessExemptPath(location.pathname)
  ) {
    return <Navigate to={ROUTES.UNDER_CONSTRUCTION} replace />;
  }

  return <Outlet />;
}
