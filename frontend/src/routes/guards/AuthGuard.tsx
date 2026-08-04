import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Role, hasMinRole, type RoleCode } from '@machinefit/shared';
import { userApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';

interface AuthGuardProps {
  children?: ReactNode;
  /** Minimum role level required (hierarchical). Default: member. */
  minRole?: RoleCode;
}

export function AuthGuard({ children, minRole = Role.MEMBER }: AuthGuardProps) {
  const hydrated = useAuthHydration();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const location = useLocation();

  const meQuery = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: async () => (await userApi.getMe()).data.data,
    enabled: hydrated && isAuthenticated,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (meQuery.data) updateUser(meQuery.data);
  }, [meQuery.data, updateUser]);

  if (!hydrated) {
    return (
      <div className="auth-guard-loading" aria-busy="true" aria-live="polite">
        <Skeleton count={2} height={72} />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const liveNeedsConsent = meQuery.data?.needsConsent ?? user.needsConsent;
  if (liveNeedsConsent && location.pathname !== ROUTES.AUTH_TERMS) {
    return <Navigate to={ROUTES.AUTH_TERMS} replace />;
  }

  // Elevated routes must wait for live /me — never trust persisted localStorage role alone.
  const needsLiveRole = minRole !== Role.MEMBER && minRole !== Role.GUEST;
  if (needsLiveRole && (meQuery.isLoading || meQuery.isFetching) && !meQuery.data) {
    return (
      <div className="auth-guard-loading" aria-busy="true" aria-live="polite">
        <Skeleton count={2} height={72} />
      </div>
    );
  }

  if (needsLiveRole && meQuery.isError) {
    clearAuth();
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const roleCode = needsLiveRole
    ? (meQuery.data?.roleCode ?? Role.MEMBER)
    : (meQuery.data?.roleCode ?? user.roleCode);

  if (!hasMinRole(roleCode, minRole)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (children) return <>{children}</>;
  return <Outlet />;
}
