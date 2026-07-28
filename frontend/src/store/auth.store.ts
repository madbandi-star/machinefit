import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User, AuthTokens } from '@machinefit/shared';

interface AuthState {
  user: User | null;
  /** Access token only — kept in memory, never persisted. Refresh lives in HttpOnly cookie. */
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

function sanitizePersistedUser(user: User | null): User | null {
  if (!user) return null;
  const { heightCm: _h, weightKg: _w, age: _a, ...safe } = user;
  return safe;
}

/** Drop refresh from memory once cookie owns it; never persist any token. */
function memoryTokens(tokens: AuthTokens): AuthTokens {
  return {
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      setAuth: (user, tokens) =>
        set({ user, tokens: memoryTokens(tokens), isAuthenticated: true }),
      updateTokens: (tokens) =>
        set((state) => ({
          tokens: memoryTokens(tokens),
          isAuthenticated: state.user != null,
        })),
      clearAuth: () => set({ user: null, tokens: null, isAuthenticated: false }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'machinefit-auth',
      version: 2,
      storage: createJSONStorage(() => authSessionStorage),
      partialize: (state) => ({
        user: sanitizePersistedUser(state.user),
        isAuthenticated: state.isAuthenticated,
      }),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as {
          user?: User | null;
          tokens?: AuthTokens | null;
          isAuthenticated?: boolean;
        };
        // Keep legacy refreshToken in memory one boot so SessionRestore can mint a cookie.
        return {
          user: state.user ?? null,
          tokens: state.tokens ?? null,
          isAuthenticated: Boolean(state.isAuthenticated && state.user),
        };
      },
    }
  )
);
