import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { loadOAuthPending } from '@/utils/oauthPending';
import { ROUTES } from '@/constants/routes';

interface ConsentFlowGuardProps {
  children: ReactNode;
}

/** Allows terms agreement for staged OAuth signup or authenticated reconsent. */
export function ConsentFlowGuard({ children }: ConsentFlowGuardProps) {
  const hydrated = useAuthHydration();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const needsConsent = useAuthStore((s) => s.user?.needsConsent);
  const pending = loadOAuthPending();

  if (!hydrated) return null;

  if (pending?.pendingToken || (isAuthenticated && needsConsent)) {
    return <>{children}</>;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Navigate to={ROUTES.LOGIN} replace />;
}
