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
  const location = useLocation();

  const meQuery = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: async () => (await userApi.getMe()).data.data,
    enabled: hydrated && isAuthenticated,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
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

  const roleCode = meQuery.data?.roleCode ?? user.roleCode;
  if (!hasMinRole(roleCode, minRole)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (children) return <>{children}</>;
  return <Outlet />;
}
