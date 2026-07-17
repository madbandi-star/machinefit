import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type PwaInstallMode = 'native' | 'ios' | 'android' | 'desktop';

const PWA_INSTALLED_KEY = 'machinefit-pwa-installed';

const STANDALONE_DISPLAY_MODES = [
  'standalone',
  'fullscreen',
  'minimal-ui',
  'window-controls-overlay',
] as const;

export function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;

  return STANDALONE_DISPLAY_MODES.some((mode) =>
    window.matchMedia(`(display-mode: ${mode})`).matches
  );
}

function readPersistedPwaInstalled(): boolean {
  try {
    return localStorage.getItem(PWA_INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPwaInstalled(): void {
  try {
    localStorage.setItem(PWA_INSTALLED_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
  usePwaStore.getState().setIsInstalled(true);
}

export function resolveIsInstalled(): boolean {
  return getIsStandalone() || readPersistedPwaInstalled();
}

async function detectInstalledRelatedApp(): Promise<boolean> {
  if (!('getInstalledRelatedApps' in navigator)) return false;

  try {
    const nav = navigator as Navigator & {
      getInstalledRelatedApps: () => Promise<unknown[]>;
    };
    const related = await nav.getInstalledRelatedApps();
    return related.length > 0;
  } catch {
    return false;
  }
}

export async function refreshPwaInstalledState(): Promise<void> {
  if (getIsStandalone()) {
    markPwaInstalled();
    return;
  }

  if (readPersistedPwaInstalled()) {
    usePwaStore.getState().setIsInstalled(true);
    return;
  }

  if (await detectInstalledRelatedApp()) {
    markPwaInstalled();
  }
}

export function getIsIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function getIsAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

export function getInstallMode(hasNativePrompt: boolean): PwaInstallMode {
  if (hasNativePrompt) return 'native';
  if (getIsIos()) return 'ios';
  if (getIsAndroid()) return 'android';
  return 'desktop';
}

interface PwaState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  dismissed: boolean;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setIsInstalled: (installed: boolean) => void;
  setDismissed: (dismissed: boolean) => void;
}

export const usePwaStore = create<PwaState>((set) => ({
  deferredPrompt: null,
  isInstalled: typeof window !== 'undefined' ? resolveIsInstalled() : false,
  dismissed:
    typeof window !== 'undefined'
      ? localStorage.getItem('machinefit-pwa-install-dismissed') === '1'
      : false,
  setDeferredPrompt: (deferredPrompt) => set({ deferredPrompt }),
  setIsInstalled: (isInstalled) => set({ isInstalled }),
  setDismissed: (dismissed) => set({ dismissed }),
}));

let listenersInitialized = false;

function watchStandaloneDisplayMode(): void {
  for (const mode of STANDALONE_DISPLAY_MODES) {
    const media = window.matchMedia(`(display-mode: ${mode})`);
    const handleChange = () => {
      if (media.matches) {
        markPwaInstalled();
      }
    };

    handleChange();
    if ('addEventListener' in media) {
      media.addEventListener('change', handleChange);
    } else if ('addListener' in media) {
      (media as MediaQueryList).addListener(handleChange);
    }
  }
}

export function initPwaInstallListeners(): void {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  void refreshPwaInstalledState();
  watchStandaloneDisplayMode();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    usePwaStore.getState().setDeferredPrompt(event as BeforeInstallPromptEvent);
  });

  window.addEventListener('appinstalled', () => {
    usePwaStore.getState().setDeferredPrompt(null);
    markPwaInstalled();
  });

  window.addEventListener('pageshow', () => {
    void refreshPwaInstalledState();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void refreshPwaInstalledState();
    }
  });
}
