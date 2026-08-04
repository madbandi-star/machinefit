import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { restoreSessionFromRefresh } from '@/services/http/axios-client';
import { clearGymScope } from '@/utils/syncGymScope';
import { clearKakaoOAuthStaging } from '@/utils/oauthClient';
import { clearOAuthPending, clearTermsChecks } from '@/utils/oauthPending';

const AuthHydrationContext = createContext(false);

function initialSessionReady(hydrated: boolean): boolean {
  if (!hydrated) return false;
  const { isAuthenticated, user, tokens } = useAuthStore.getState();
  if (!isAuthenticated || !user) return true;
  // Same-tab navigation: access JWT already in memory.
  return Boolean(tokens?.accessToken);
}

function useRunAuthHydration(): boolean {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  const [sessionReady, setSessionReady] = useState(() =>
    initialSessionReady(useAuthStore.persist.hasHydrated())
  );

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
      // Guests (and in-memory sessions) become ready in the same turn as persist hydrate.
      if (initialSessionReady(true)) {
        setSessionReady(true);
      }
    });
    const already = useAuthStore.persist.hasHydrated();
    setHydrated(already);
    if (already && initialSessionReady(true)) {
      setSessionReady(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (sessionReady) return;

    let cancelled = false;

    async function ensureAccessToken() {
      const { user, tokens, isAuthenticated, clearAuth } = useAuthStore.getState();

      if (!isAuthenticated || !user) {
        if (!cancelled) setSessionReady(true);
        return;
      }

      // Same-tab navigation: access JWT already in memory.
      if (tokens?.accessToken) {
        if (!cancelled) setSessionReady(true);
        return;
      }

      // F5 / new document: restore via sessionStorage refresh token and/or HttpOnly cookie.
      const ok = await restoreSessionFromRefresh();
      if (!ok && !cancelled) {
        clearAuth();
        clearGymScope();
        clearKakaoOAuthStaging();
        clearOAuthPending();
        clearTermsChecks();
      }
      if (!cancelled) setSessionReady(true);
    }

    void ensureAccessToken();
    return () => {
      cancelled = true;
    };
  }, [hydrated, sessionReady]);

  return hydrated && sessionReady;
}

export function AuthHydrationProvider({ children }: { children: ReactNode }) {
  const ready = useRunAuthHydration();
  return (
    <AuthHydrationContext.Provider value={ready}>{children}</AuthHydrationContext.Provider>
  );
}

/** Single shared session restore — avoids duplicate /auth/refresh on boot. */
export function useAuthHydration(): boolean {
  return useContext(AuthHydrationContext);
}
