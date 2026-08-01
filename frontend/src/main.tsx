import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/globals.css';
import '@/styles/components.css';
import '@/styles/collapsible-card.css';
import '@/styles/android-ui.css';
import { AppProviders } from '@/app/providers/AppProviders';
import { App } from '@/app/App';
import {
  clearChunkRetryState,
  initPwaAutoUpdate,
  installGlobalChunkErrorHandlers,
  markAppBootHealthy,
  pruneStaleChunkRetryState,
} from '@/utils/chunkLoadRecovery';

/** Bump once when a final PWA cache purge is required; thereafter one-shot only. */
const PWA_CACHE_BUST_KEY = 'mf-pwa-bust-v36';

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
  installGlobalChunkErrorHandlers();
  initPwaAutoUpdate();
  pruneStaleChunkRetryState();

  // Strip one-shot recover query so shares/bookmarks stay clean after reload.
  let justRecovered = false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has('mf_recover')) {
      justRecovered = true;
      url.searchParams.delete('mf_recover');
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    /* ignore */
  }

  // One-shot migration: clear legacy SW/caches once, then never block boot again.
  try {
    if (!localStorage.getItem(PWA_CACHE_BUST_KEY)) {
      await clearServiceWorkerAndCaches();
      localStorage.setItem(PWA_CACHE_BUST_KEY, '1');
      // Fresh SW registration will happen on next load via initPwaAutoUpdate.
      clearChunkRetryState();
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

  // After a recover reload, wait longer before clearing the counter so attempts accumulate.
  window.setTimeout(
    () => {
      markAppBootHealthy();
    },
    justRecovered ? 15_000 : 4_000
  );
}

void boot();
