import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  /**
   * Signature of today's active plans last seen on the Records page.
   * When it matches the current plan set, the Records green plan-dot stays off.
   */
  recordsPlanDotSeenKey: string | null;
  setLoading: (isLoading: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  setRecordsNavNudge: (active: boolean, opts?: { tip?: boolean }) => void;
  markRecordsPlanDotSeen: (planSignature: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function clearToastTimer() {
  if (toastTimer != null) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isLoading: false,
      toast: null,
      recordsNavNudge: false,
      recordsNavNudgeTip: false,
      recordsPlanDotSeenKey: null,
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
      markRecordsPlanDotSeen: (planSignature) =>
        set({ recordsPlanDotSeenKey: planSignature }),
    }),
    {
      name: 'machinefit-ui',
      partialize: (s) => ({ recordsPlanDotSeenKey: s.recordsPlanDotSeenKey }),
    }
  )
);
