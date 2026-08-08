import { create } from 'zustand';
import {
  acquireRestLockScreenSession,
  publishRestLockScreen,
  releaseRestLockScreenSession,
} from '@/utils/workoutLockScreen';

export type RestTimerDisplayOverride = 'auto' | 'compact' | 'full';

export interface RestTimerSession {
  setNumber: number;
  /** Wall-clock end while running; null when paused. */
  endsAtMs: number | null;
  /** Remaining seconds while paused. */
  pausedRemainingSec: number | null;
  sessionId: number;
}

interface RestTimerCallbacks {
  onReadyForNextSet: (() => void) | null;
  onStartCount: (() => void) | null;
}

interface RestTimerState {
  session: RestTimerSession | null;
  displayOverride: RestTimerDisplayOverride;
  startCountAvailable: boolean;
  start: (setNumber: number, seconds: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  complete: () => void;
  setDisplayOverride: (mode: RestTimerDisplayOverride) => void;
  minimize: () => void;
  expand: () => void;
  getRemainingSec: () => number;
  isPaused: () => boolean;
  setStartCountAvailable: (available: boolean) => void;
}

let sessionCounter = 0;

const callbacks: RestTimerCallbacks = {
  onReadyForNextSet: null,
  onStartCount: null,
};

/** Workout page registers these while mounted; cleared on unmount. */
export function registerRestTimerCallbacks(next: {
  onReadyForNextSet?: (() => void) | null;
  onStartCount?: (() => void) | null;
}): void {
  if ('onReadyForNextSet' in next) {
    callbacks.onReadyForNextSet = next.onReadyForNextSet ?? null;
  }
  if ('onStartCount' in next) {
    callbacks.onStartCount = next.onStartCount ?? null;
    useRestTimerStore.getState().setStartCountAvailable(Boolean(next.onStartCount));
  }
}

export function invokeRestTimerReadyForNextSet(): void {
  callbacks.onReadyForNextSet?.();
}

export function invokeRestTimerStartCount(): void {
  callbacks.onStartCount?.();
}

export const useRestTimerStore = create<RestTimerState>((set, get) => ({
  session: null,
  displayOverride: 'auto',
  startCountAvailable: false,

  start: (setNumber, seconds) => {
    sessionCounter += 1;
    const sec = Math.max(0, Math.ceil(seconds));
    set({
      session: {
        setNumber,
        endsAtMs: Date.now() + sec * 1000,
        pausedRemainingSec: null,
        sessionId: sessionCounter,
      },
      // Prefer compact banner first; user can expand to fullscreen.
      displayOverride: 'compact',
    });
    // Gesture turn: keep Media Session alive so lock screen can show rest time.
    void acquireRestLockScreenSession().then(() => {
      const state = get();
      if (!state.session) return;
      // Host tick also publishes; this covers the gesture-start moment.
      publishRestLockScreen({
        setNumber: state.session.setNumber,
        remainingSec: state.getRemainingSec(),
        paused: state.isPaused(),
      });
    });
  },

  pause: () => {
    const { session } = get();
    if (!session || session.endsAtMs == null) return;
    const remaining = Math.max(0, (session.endsAtMs - Date.now()) / 1000);
    set({
      session: {
        ...session,
        endsAtMs: null,
        pausedRemainingSec: remaining,
      },
    });
  },

  resume: () => {
    const { session } = get();
    if (!session || session.pausedRemainingSec == null) return;
    set({
      session: {
        ...session,
        endsAtMs: Date.now() + session.pausedRemainingSec * 1000,
        pausedRemainingSec: null,
      },
    });
  },

  stop: () => {
    set({ session: null, displayOverride: 'auto' });
    void releaseRestLockScreenSession();
  },

  complete: () => {
    const { session } = get();
    if (!session) return;
    set({ session: null, displayOverride: 'auto' });
    void releaseRestLockScreenSession();
    callbacks.onReadyForNextSet?.();
  },

  setDisplayOverride: (displayOverride) => set({ displayOverride }),
  minimize: () => set({ displayOverride: 'compact' }),
  expand: () => set({ displayOverride: 'full' }),
  setStartCountAvailable: (startCountAvailable) => set({ startCountAvailable }),

  getRemainingSec: () => {
    const { session } = get();
    if (!session) return 0;
    if (session.pausedRemainingSec != null) {
      return Math.ceil(session.pausedRemainingSec);
    }
    if (session.endsAtMs == null) return 0;
    return Math.max(0, Math.ceil((session.endsAtMs - Date.now()) / 1000));
  },

  isPaused: () => get().session?.pausedRemainingSec != null,
}));
