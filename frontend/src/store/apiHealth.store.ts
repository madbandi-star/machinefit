import { create } from 'zustand';

export type ServiceOutageKind = 'network' | 'server' | 'unavailable' | null;

type ApiHealthState = {
  consecutiveFailures: number;
  outage: ServiceOutageKind;
  lastStatus: number | null;
  recordSuccess: () => void;
  recordFailure: (kind: Exclude<ServiceOutageKind, null>, status?: number | null) => void;
  clearOutage: () => void;
};

const FAILURE_THRESHOLD = 3;

/**
 * Tracks consecutive API transport failures.
 * Does not change happy-path UI — only surfaces ServiceUnavailableScreen when threshold hit.
 */
export const useApiHealthStore = create<ApiHealthState>((set, get) => ({
  consecutiveFailures: 0,
  outage: null,
  lastStatus: null,
  recordSuccess: () => {
    if (get().consecutiveFailures === 0 && get().outage == null) return;
    set({ consecutiveFailures: 0, outage: null, lastStatus: null });
  },
  recordFailure: (kind, status = null) => {
    const next = get().consecutiveFailures + 1;
    set({
      consecutiveFailures: next,
      lastStatus: status,
      outage: next >= FAILURE_THRESHOLD ? kind : get().outage,
    });
  },
  clearOutage: () => set({ consecutiveFailures: 0, outage: null, lastStatus: null }),
}));
