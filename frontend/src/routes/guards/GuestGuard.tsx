import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { isActiveServiceUsername } from '@machinefit/shared';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';
import { useAuthHydration } from '@/hooks/useAuthHydration';

interface GuestGuardProps {
  children: ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const hydrated = useAuthHydration();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!hydrated) return null;

  if (isAuthenticated && user) {
    if (!isActiveServiceUsername(user.displayName)) {
      return <Navigate to={ROUTES.UNDER_CONSTRUCTION} replace />;
    }
    if (user.needsConsent) {
      return <Navigate to={ROUTES.AUTH_TERMS} replace />;
    }
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}
