import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';
import '@/styles/components.css';
import '@/styles/collapsible-card.css';
import '@/styles/android-ui.css';
import { AppProviders } from '@/app/providers/AppProviders';
import { App } from '@/app/App';

/** Bump once when a final PWA cache purge is required; thereafter one-shot only. */
const PWA_CACHE_BUST_KEY = 'mf-pwa-bust-v24';

async function clearServiceWorkerAndCaches(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    /* ignore */
  }
}

async function boot() {
  // One-shot migration: clear legacy SW/caches once, then never block boot again.
  try {
    if (!localStorage.getItem(PWA_CACHE_BUST_KEY)) {
      await clearServiceWorkerAndCaches();
      localStorage.setItem(PWA_CACHE_BUST_KEY, '1');
      window.location.reload();
      return;
    }
  } catch {
    /* ignore */
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>
  );
}

void boot();
