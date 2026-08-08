import { create } from 'zustand';

export const TOAST_DURATION_MS = 3000;

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

interface UIState {
  isLoading: boolean;
  toast: ToastState | null;
  /** Ephemeral: soft-highlight bottom-nav Records (recommend, plan-add, or detail). */
  recordsNavNudge: boolean;
  /** When true with nudge, show the short tip bubble above Records. */
  recordsNavNudgeTip: boolean;
  setLoading: (isLoading: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  setRecordsNavNudge: (active: boolean, opts?: { tip?: boolean }) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function clearToastTimer() {
  if (toastTimer != null) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
}

export const useUIStore = create<UIState>((set, get) => ({
  isLoading: false,
  toast: null,
  recordsNavNudge: false,
  recordsNavNudgeTip: false,
  setLoading: (isLoading) => set({ isLoading }),
  showToast: (message, type = 'info') => {
    clearToastTimer();
    const id = Date.now();
    set({ toast: { message, type, id } });
    toastTimer = setTimeout(() => {
      if (get().toast?.id === id) {
        set({ toast: null });
      }
      toastTimer = null;
    }, TOAST_DURATION_MS);
  },
  hideToast: () => {
    clearToastTimer();
    set({ toast: null });
  },
  setRecordsNavNudge: (active, opts) =>
    set({
      recordsNavNudge: active,
      recordsNavNudgeTip: active ? Boolean(opts?.tip) : false,
    }),
}));
