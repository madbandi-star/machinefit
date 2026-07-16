import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';
import type { RoleCode } from '@machinefit/shared';
import { ROLE_HIERARCHY } from '@machinefit/shared';

interface AuthGuardProps {
  children: ReactNode;
  minRole?: RoleCode;
}

export function AuthGuard({ children, minRole = 'member' }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (ROLE_HIERARCHY[user.roleCode] < ROLE_HIERARCHY[minRole]) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}
