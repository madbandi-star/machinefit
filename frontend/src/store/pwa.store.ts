import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type PwaInstallMode = 'native' | 'ios' | 'android' | 'desktop';

function getIsStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
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
  isInstalled: typeof window !== 'undefined' ? getIsStandalone() : false,
  dismissed:
    typeof window !== 'undefined'
      ? localStorage.getItem('machinefit-pwa-install-dismissed') === '1'
      : false,
  setDeferredPrompt: (deferredPrompt) => set({ deferredPrompt }),
  setIsInstalled: (isInstalled) => set({ isInstalled }),
  setDismissed: (dismissed) => set({ dismissed }),
}));

let listenersInitialized = false;

export function initPwaInstallListeners(): void {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  if (getIsStandalone()) {
    usePwaStore.getState().setIsInstalled(true);
    return;
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    usePwaStore.getState().setDeferredPrompt(event as BeforeInstallPromptEvent);
  });

  window.addEventListener('appinstalled', () => {
    const { setIsInstalled, setDeferredPrompt } = usePwaStore.getState();
    setIsInstalled(true);
    setDeferredPrompt(null);
  });
}
