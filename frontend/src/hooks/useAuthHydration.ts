import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { restoreSessionFromRefresh } from '@/services/http/axios-client';
import { clearGymScope } from '@/utils/syncGymScope';

/**
 * Wait for zustand rehydrate, then ensure an in-memory access token exists.
 * Refresh JWT is HttpOnly — after a full reload we mint access via cookie
 * (or one-time legacy body refreshToken still in memory from old storage).
 */
export function useAuthHydration() {
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

      // Same-tab session already has access (e.g. just logged in).
      // Still migrate if a legacy refreshToken is lingering in memory.
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
