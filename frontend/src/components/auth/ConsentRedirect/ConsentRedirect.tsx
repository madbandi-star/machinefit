import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { ROUTES } from '@/constants/routes';

const LEGAL_PREFIXES = [
  ROUTES.TERMS,
  ROUTES.PRIVACY,
  ROUTES.LEGAL_LOCATION,
  ROUTES.LEGAL_MARKETING,
  ROUTES.LEGAL_COMMERCE,
  ROUTES.LEGAL_COMMUNITY,
  ROUTES.LEGAL_COPYRIGHT,
  ROUTES.LEGAL_AI,
  ROUTES.LEGAL_SECURITY,
  ROUTES.LEGAL_ILLEGAL_USE,
];

function isLegalDocPath(pathname: string): boolean {
  return LEGAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Soft-gate: authenticated users with outdated consents must re-agree (legal docs stay readable). */
export function ConsentRedirect() {
  const hydrated = useAuthHydration();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const needsConsent = useAuthStore((s) => s.user?.needsConsent);

  if (!hydrated || !isAuthenticated || !needsConsent) return null;
  if (location.pathname === ROUTES.AUTH_TERMS || isLegalDocPath(location.pathname)) {
    return null;
  }
  return <Navigate to={ROUTES.AUTH_TERMS} replace />;
}
