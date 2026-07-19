import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@/styles/globals.css';
import '@/styles/components.css';
import '@/styles/android-ui.css';
import { AppProviders } from '@/app/providers/AppProviders';
import { App } from '@/app/App';

const PWA_CACHE_BUST_KEY = 'mf-pwa-bust-v4';

function applyPlatformAttribute() {
  try {
    const ua = navigator.userAgent || '';
    const uaPlatform = navigator.userAgentData?.platform ?? '';
    const isIos =
      /iPhone|iPad|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
      /iOS|iPhone|iPad/i.test(uaPlatform);

    let platform: 'android' | 'ios' | 'other' = 'other';
    if (isIos) {
      platform = 'ios';
    } else if (
      /Android/i.test(ua) ||
      /Android/i.test(uaPlatform) ||
      Boolean(navigator.userAgentData?.mobile)
    ) {
      // Desktop-site mode on Android often drops "Android" from UA.
      platform = 'android';
    }
    document.documentElement.setAttribute('data-platform', platform);
  } catch {
    /* ignore */
  }
}

async function bustStalePwaCacheOnce(): Promise<boolean> {
  try {
    if (localStorage.getItem(PWA_CACHE_BUST_KEY)) return false;
    localStorage.setItem(PWA_CACHE_BUST_KEY, '1');

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

function boot() {
  applyPlatformAttribute();

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const checkForUpdate = () => {
        void registration.update();
      };
      checkForUpdate();
      setInterval(checkForUpdate, 30_000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
    },
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>
  );
}

void bustStalePwaCacheOnce().then((reloading) => {
  if (!reloading) boot();
});
