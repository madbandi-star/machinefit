import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CredentialsState {
  email: string;
  /** @deprecated Never persist passwords — kept empty for migration. */
  password: string;
  rememberLogin: boolean;
  saveCredentials: (email: string) => void;
  clearCredentials: () => void;
  setRememberLogin: (remember: boolean) => void;
}

/**
 * Remember-me stores email only (never password).
 * Cleared on explicit logout / uncheck; kept in localStorage for login UX.
 */
export const useCredentialsStore = create<CredentialsState>()(
  persist(
    (set) => ({
      email: '',
      password: '',
      rememberLogin: false,
      saveCredentials: (email) => set({ email: email.trim(), password: '', rememberLogin: true }),
      clearCredentials: () => set({ email: '', password: '', rememberLogin: false }),
      setRememberLogin: (rememberLogin) =>
        set(
          rememberLogin
            ? { rememberLogin: true }
            : { rememberLogin: false, email: '', password: '' }
        ),
    }),
    {
      name: 'machinefit-credentials',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CredentialsState>;
        return {
          ...current,
          ...p,
          password: '',
        };
      },
    }
  )
);
