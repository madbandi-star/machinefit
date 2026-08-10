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
 * Trim high-sensitivity fields from sessionStorage. Keep height/weight so home
 * profile gates don't flash "incomplete" after refresh before /me returns.
 */
function sanitizePersistedUser(user: User | null): User | null {
  if (!user) return null;
  const { age: _a, ...safe } = user;
  return safe;
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
          const next = state.user ? { ...state.user, ...partial } : null;
          if (next?.id) setSentryUser({ id: next.id });
          return { user: next };
        }),
    }),
    {
      name: 'machinefit-auth',
      version: 4,
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
