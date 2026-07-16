import { useEffect, useState } from 'react';

interface PersistApi {
  hasHydrated: () => boolean;
  onFinishHydration: (callback: () => void) => () => void;
}

export function usePersistHydration(persist: PersistApi) {
  const [hydrated, setHydrated] = useState(() => persist.hasHydrated());

  useEffect(() => {
    const unsub = persist.onFinishHydration(() => setHydrated(true));
    setHydrated(persist.hasHydrated());
    return unsub;
  }, [persist]);

  return hydrated;
}
