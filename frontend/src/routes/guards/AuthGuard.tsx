import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';
import type { RoleCode } from '@machinefit/shared';
import { ROLE_HIERARCHY } from '@machinefit/shared';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';

interface AuthGuardProps {
  children?: ReactNode;
  minRole?: RoleCode;
}

export function AuthGuard({ children, minRole = 'member' }: AuthGuardProps) {
  const hydrated = useAuthHydration();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

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

  if (ROLE_HIERARCHY[user.roleCode] < ROLE_HIERARCHY[minRole]) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  if (children) return <>{children}</>;
  return <Outlet />;
}
