import { useCallback, useEffect } from 'react';
import {
  getInstallMode,
  initPwaInstallListeners,
  markPwaInstalled,
  refreshPwaInstalledState,
  usePwaStore,
} from '@/store/pwa.store';

initPwaInstallListeners();

export function usePwaInstall() {
  const deferredPrompt = usePwaStore((s) => s.deferredPrompt);
  const isInstalled = usePwaStore((s) => s.isInstalled);
  const dismissed = usePwaStore((s) => s.dismissed);
  const setDeferredPrompt = usePwaStore((s) => s.setDeferredPrompt);
  const setDismissed = usePwaStore((s) => s.setDismissed);

  useEffect(() => {
    void refreshPwaInstalledState();
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === 'accepted') {
      markPwaInstalled();
      return true;
    }
    return false;
  }, [deferredPrompt, setDeferredPrompt]);

  const dismiss = useCallback(() => {
    localStorage.setItem('machinefit-pwa-install-dismissed', '1');
    setDismissed(true);
  }, [setDismissed]);

  const hasNativePrompt = !!deferredPrompt;
  const installMode = getInstallMode(hasNativePrompt);
  const canInstall = !isInstalled;
  const canPrompt = hasNativePrompt && !isInstalled && !dismissed;

  return {
    canPrompt,
    canInstall,
    hasNativePrompt,
    installMode,
    install,
    dismiss,
    isInstalled,
  };
}
