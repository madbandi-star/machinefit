import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation/BottomNavigation';
import { LegalFooter } from '@/components/layout/LegalFooter/LegalFooter';
import { ConsentRedirect } from '@/components/auth/ConsentRedirect/ConsentRedirect';
import { GlobalCountSessionHost } from '@/components/recommendation/GlobalCountSessionHost/GlobalCountSessionHost';
import { GlobalRestTimerHost } from '@/components/recommendation/GlobalRestTimerHost/GlobalRestTimerHost';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants/routes';
import { peekPersistedIsAuthenticated } from '@/utils/peekPersistedAuth';
import '@/styles/layout.css';
import '@/styles/legal.css';
import '@/styles/auth.css';

function isHomePath(pathname: string): boolean {
  return pathname === ROUTES.HOME || pathname === `${ROUTES.HOME}/`;
}

export function MainLayout() {
  const location = useLocation();
  const authReady = useAuthHydration();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onHome = isHomePath(location.pathname);
  /** Persist rehydrate is async — peek so logged-in users never flash the marketing shell. */
  const [assumeAuthed] = useState(
    () => isAuthenticated || peekPersistedIsAuthenticated()
  );
  const treatAsAuthed = isAuthenticated || (!authReady && assumeAuthed);

  /**
   * Guests: black landing shell + Outlet (AuthLanding) — no empty boot remount.
   * Returning users: keep app chrome while session restore runs (HomePage skeleton).
   */
  const showGuestLandingShell = onHome && !treatAsAuthed;

  if (showGuestLandingShell) {
    return (
      <div className="layout layout--auth-landing">
        <ConsentRedirect />
        <Outlet />
        <LegalFooter compact hideBelowSupport />
      </div>
    );
  }

  return (
    <div className="layout">
      <ConsentRedirect />
      <Header />
      <GlobalRestTimerHost />
      <GlobalCountSessionHost />
      <main className="layout__main">
        <div className="layout__content">
          <Outlet />
        </div>
        <LegalFooter />
      </main>
      <BottomNavigation />
    </div>
  );
}
