import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { restoreSessionFromRefresh } from '@/services/http/axios-client';
import { clearGymScope } from '@/utils/syncGymScope';

const AuthHydrationContext = createContext(false);

function useRunAuthHydration(): boolean {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuthStore.persist.hasHydrated());
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    async function ensureAccessToken() {
      const { user, tokens, isAuthenticated, clearAuth } = useAuthStore.getState();

      if (!isAuthenticated || !user) {
        if (!cancelled) setSessionReady(true);
        return;
      }

      if (tokens?.accessToken && !tokens.refreshToken) {
        if (!cancelled) setSessionReady(true);
        return;
      }

      const ok = await restoreSessionFromRefresh();
      if (!ok) {
        clearAuth();
        clearGymScope();
      }
      if (!cancelled) setSessionReady(true);
    }

    void ensureAccessToken();
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

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
