import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  isActiveServiceAccessEnforced,
  isActiveServiceUsername,
} from '@machinefit/shared';
import { userApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
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
  const updateUser = useAuthStore((s) => s.updateUser);
  const enforced = isActiveServiceAccessEnforced(
    import.meta.env.VITE_ACTIVE_SERVICE_ACCESS as string | undefined
  );

  const meQuery = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: async () => (await userApi.getMe()).data.data,
    enabled: enforced && hydrated && isAuthenticated,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (meQuery.data) updateUser(meQuery.data);
  }, [meQuery.data, updateUser]);

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

  if (isAccessExemptPath(location.pathname)) {
    return <Outlet />;
  }

  if (!isAuthenticated) {
    return <Outlet />;
  }

  // Wait for persisted user and/or live /me before deciding (avoid flash of app chrome).
  const liveName = meQuery.data?.displayName ?? user?.displayName;
  if (!liveName && (meQuery.isLoading || meQuery.isFetching || !user)) {
    return (
      <div className="auth-guard-loading" aria-busy="true" aria-live="polite">
        <Skeleton count={2} height={72} />
      </div>
    );
  }

  if (!isActiveServiceUsername(liveName ?? user?.displayName)) {
    return <Navigate to={ROUTES.UNDER_CONSTRUCTION} replace />;
  }

  return <Outlet />;
}
