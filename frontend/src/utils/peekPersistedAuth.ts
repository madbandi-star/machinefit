/** Sync peek of persisted auth — avoids guest-landing flash before zustand rehydrates. */

const AUTH_STORAGE_KEY = 'machinefit-auth';

export function peekPersistedIsAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw =
      window.sessionStorage.getItem(AUTH_STORAGE_KEY) ??
      window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      state?: { isAuthenticated?: boolean; user?: unknown };
      isAuthenticated?: boolean;
      user?: unknown;
    };
    const state = parsed.state ?? parsed;
    return Boolean(state.isAuthenticated && state.user);
  } catch {
    return false;
  }
}
