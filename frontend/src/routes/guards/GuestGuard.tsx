import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
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
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}
