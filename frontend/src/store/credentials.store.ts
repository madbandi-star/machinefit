import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CredentialsState {
  email: string;
  password: string;
  rememberLogin: boolean;
  saveCredentials: (email: string, password: string) => void;
  clearCredentials: () => void;
  setRememberLogin: (remember: boolean) => void;
}

export const useCredentialsStore = create<CredentialsState>()(
  persist(
    (set) => ({
      email: '',
      password: '',
      rememberLogin: false,
      saveCredentials: (email, password) =>
        set({ email, password, rememberLogin: true }),
      clearCredentials: () =>
        set({ email: '', password: '', rememberLogin: false }),
      setRememberLogin: (rememberLogin) => set({ rememberLogin }),
    }),
    { name: 'machinefit-credentials' }
  )
);
