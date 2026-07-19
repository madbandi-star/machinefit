import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@/styles/globals.css';
import '@/styles/components.css';
import '@/styles/android-ui.css';
import { AppProviders } from '@/app/providers/AppProviders';
import { App } from '@/app/App';

function applyPlatformAttribute() {
  try {
    const ua = navigator.userAgent || '';
    const uaPlatform = navigator.userAgentData?.platform ?? '';
    let platform: 'android' | 'ios' | 'other' = 'other';
    if (/Android/i.test(ua) || /Android/i.test(uaPlatform)) {
      platform = 'android';
    } else if (
      /iPhone|iPad|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    ) {
      platform = 'ios';
    }
    document.documentElement.setAttribute('data-platform', platform);
  } catch {
    /* ignore */
  }
}

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
