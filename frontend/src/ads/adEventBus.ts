type AdBusListener = (payload: { placement: string; event?: string; eventCount?: number }) => void;

const listeners = new Set<AdBusListener>();

export const adEventBus = {
  emit(payload: { placement: string; event?: string; eventCount?: number }): void {
    for (const fn of listeners) {
      try {
        fn(payload);
      } catch {
        /* ignore listener errors */
      }
    }
  },
  subscribe(fn: AdBusListener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
