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

/**
 * Bump once when a final PWA cache purge is required; thereafter one-shot only.
 * v39: stop index.html unregister-every-load race that looped with autoUpdate reload.
 */
const PWA_CACHE_BUST_KEY = 'mf-pwa-bust-v39';
/** Legacy keys from older bust scripts — mark done so stale HTML never thrash-clears SW. */
const LEGACY_PWA_BUST_KEYS = ['mf-pwa-bust-v29', 'mf-pwa-bust-v38'] as const;

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

function markPwaBustComplete(): void {
  try {
    localStorage.setItem(PWA_CACHE_BUST_KEY, '1');
    for (const key of LEGACY_PWA_BUST_KEYS) {
      localStorage.setItem(key, '1');
    }
  } catch {
    /* ignore */
  }
}

async function boot() {
  installGlobalChunkErrorHandlers();
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

  // One-shot migration: clear legacy SW/caches once, THEN register SW (never before).
  try {
    if (!localStorage.getItem(PWA_CACHE_BUST_KEY)) {
      await clearServiceWorkerAndCaches();
      markPwaBustComplete();
      clearChunkRetryState();
      window.location.reload();
      return;
    }
    // Ensure legacy flags exist even when v39 already set (cached old index.html).
    markPwaBustComplete();
  } catch {
    /* ignore */
  }

  initPwaAutoUpdate();

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
