import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User, AuthTokens } from '@machinefit/shared';
import { setSentryUser } from '@/app/sentry';

interface AuthState {
  user: User | null;
  /**
   * Access token is memory-only. Refresh token is kept in memory and
   * partialized to sessionStorage so F5 can restore across Pages→Render
   * (third-party HttpOnly cookies are often blocked).
   */
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  updateTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

/**
 * Prefer sessionStorage so profile session doesn't survive browser restarts on shared devices.
 * Migrate once from legacy localStorage key.
 */
const authSessionStorage = {
  getItem: (name: string) => {
    const fromSession = sessionStorage.getItem(name);
    if (fromSession != null) return fromSession;
    try {
      const legacy = localStorage.getItem(name);
      if (legacy != null) {
        sessionStorage.setItem(name, legacy);
        localStorage.removeItem(name);
        return legacy;
      }
    } catch {
      /* ignore */
    }
    return null;
  },
  setItem: (name: string, value: string) => {
    sessionStorage.setItem(name, value);
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
  removeItem: (name: string) => {
    sessionStorage.removeItem(name);
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

/**
 * SessionStorage must not hold body/contact PII. /me hydrates the rest after boot.
 */
function sanitizePersistedUser(user: User | null): User | null {
  if (!user) return null;
  return {
    id: user.id,
    roleId: user.roleId,
    roleCode: user.roleCode,
    email: '',
    displayName: user.displayName,
    unitHeight: user.unitHeight,
    unitWeight: user.unitWeight,
    languageCode: user.languageCode,
    subscriptionPlan: user.subscriptionPlan,
    activeGymId: user.activeGymId,
    homeGymName: user.homeGymName,
    marketingOptIn: user.marketingOptIn,
    locationOptIn: user.locationOptIn,
    pushServiceOptIn: user.pushServiceOptIn,
    termsVersion: user.termsVersion,
    privacyVersion: user.privacyVersion,
    locationVersion: user.locationVersion,
    marketingVersion: user.marketingVersion,
    needsConsent: user.needsConsent,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** Persist refresh only — never write the short-lived access JWT to storage. */
function persistedTokens(tokens: AuthTokens | null): Pick<AuthTokens, 'refreshToken' | 'expiresIn'> | null {
  if (!tokens?.refreshToken) return null;
  return {
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      setAuth: (user, tokens) => {
        setSentryUser({ id: user.id });
        set({ user, tokens, isAuthenticated: true });
      },
      updateTokens: (tokens) =>
        set((state) => ({
          tokens: {
            accessToken: tokens.accessToken,
            expiresIn: tokens.expiresIn,
            // Keep previous refresh if API omits it (cookie-only responses).
            refreshToken: tokens.refreshToken ?? state.tokens?.refreshToken,
          },
          isAuthenticated: state.user != null,
        })),
      clearAuth: () => {
        setSentryUser(null);
        set({ user: null, tokens: null, isAuthenticated: false });
      },
      updateUser: (partial) =>
        set((state) => {
          if (!state.user) {
            if (!('id' in partial) || !partial.id) return state;
            const next = partial as User;
            if (next.id) setSentryUser({ id: next.id });
            return { user: next };
          }
          const current = state.user;
          const incomingTs = partial.updatedAt ? Date.parse(String(partial.updatedAt)) : NaN;
          const currentTs = current.updatedAt ? Date.parse(String(current.updatedAt)) : NaN;
          // Ignore stale /me responses that lose a race with a newer PATCH (e.g. gender save).
          if (
            Number.isFinite(incomingTs) &&
            Number.isFinite(currentTs) &&
            incomingTs < currentTs
          ) {
            return state;
          }
          const next = { ...current, ...partial };
          if (next.id) setSentryUser({ id: next.id });
          return { user: next };
        }),
    }),
    {
      name: 'machinefit-auth',
      version: 5,
      storage: createJSONStorage(() => authSessionStorage),
      partialize: (state) => ({
        user: sanitizePersistedUser(state.user),
        isAuthenticated: state.isAuthenticated,
        tokens: persistedTokens(state.tokens),
      }),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as {
          user?: User | null;
          tokens?: AuthTokens | null;
          isAuthenticated?: boolean;
        };
        return {
          user: state.user ? sanitizePersistedUser(state.user) : null,
          tokens: persistedTokens(state.tokens ?? null),
          isAuthenticated: Boolean(state.isAuthenticated && state.user),
        };
      },
    }
  )
);
