import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CredentialsState {
  email: string;
  /** @deprecated Never persist passwords — kept empty for migration. */
  password: string;
  rememberLogin: boolean;
  saveCredentials: (email: string) => void;
  clearCredentials: () => void;
  setRememberLogin: (remember: boolean) => void;
}

export const useCredentialsStore = create<CredentialsState>()(
  persist(
    (set) => ({
      email: '',
      password: '',
      rememberLogin: false,
      saveCredentials: (email) => set({ email, password: '', rememberLogin: true }),
      clearCredentials: () => set({ email: '', password: '', rememberLogin: false }),
      setRememberLogin: (rememberLogin) => set({ rememberLogin }),
    }),
    {
      name: 'machinefit-credentials',
      // Strip any previously persisted password from older clients.
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
