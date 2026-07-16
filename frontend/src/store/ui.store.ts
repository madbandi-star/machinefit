import { create } from 'zustand';

interface UIState {
  isLoading: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  setLoading: (isLoading: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  toast: null,
  setLoading: (isLoading) => set({ isLoading }),
  showToast: (message, type = 'info') => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null }),
}));
