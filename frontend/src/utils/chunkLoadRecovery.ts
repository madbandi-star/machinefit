/**
 * Auto-recover from stale Vite chunks / PWA caches after a GitHub Pages deploy.
 * Keeps users on an "updating" path instead of raw ChunkLoadError screens.
 */

export const CHUNK_RETRY_COUNT_KEY = 'mf-chunk-recover-count';
export const CHUNK_RETRY_AT_KEY = 'mf-chunk-recover-at';
export const MAX_CHUNK_RECOVER_ATTEMPTS = 3;
export const CHUNK_RETRY_WAIT_MS = 5_000;
/** Drop abandoned retry counters so users are not stuck on the update screen next day. */
const RETRY_STATE_TTL_MS = 30 * 60 * 1000;

type RecoverSource =
  | 'window.onerror'
  | 'unhandledrejection'
  | 'ErrorBoundary'
  | 'errorElement'
  | 'lazyImport'
  | 'manual';

export interface ChunkErrorLogPayload {
  kind: 'chunk_load_recovery';
  source: RecoverSource;
  message: string;
  name?: string;
  url: string;
  userAgent: string;
  appVersion: string;
  buildId: string;
  retryCount: number;
  serviceWorker: string;
  stack?: string;
}

type UpdateSW = (reloadPage?: boolean) => Promise<void>;

let updateSWFn: UpdateSW | null = null;
let recoverInFlight = false;
let listenersInstalled = false;
let pwaInitStarted = false;

const CHUNK_ERROR_RE =
  /ChunkLoadError|Loading chunk [\w-]+ failed|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i;

export function getAppVersion(): string {
  try {
    if (typeof __MF_APP_VERSION__ === 'string' && __MF_APP_VERSION__) return __MF_APP_VERSION__;
  } catch {
    /* ignore */
  }
  return import.meta.env.VITE_APP_VERSION?.trim() || '0.1.0';
}

export function getBuildId(): string {
  try {
    if (typeof __MF_BUILD_ID__ === 'string' && __MF_BUILD_ID__) return __MF_BUILD_ID__;
  } catch {
    /* ignore */
  }
  return 'dev';
}

export function isChunkLoadError(error: unknown): boolean {
  if (error == null) return false;
  if (typeof error === 'string') return CHUNK_ERROR_RE.test(error);

  if (error instanceof Error) {
    if (error.name === 'ChunkLoadError') return true;
    if (CHUNK_ERROR_RE.test(error.message)) return true;
    if (error.stack && CHUNK_ERROR_RE.test(error.stack)) return true;
    return false;
  }

  if (typeof error === 'object') {
    const record = error as { message?: unknown; name?: unknown; reason?: unknown };
    if (typeof record.name === 'string' && record.name === 'ChunkLoadError') return true;
    if (typeof record.message === 'string' && CHUNK_ERROR_RE.test(record.message)) return true;
    if (record.reason != null) return isChunkLoadError(record.reason);
  }

  return false;
}

function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || error.name;
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  try {
    return String(error);
  } catch {
    return 'unknown';
  }
}

export function getChunkRetryCount(): number {
  try {
    const raw = sessionStorage.getItem(CHUNK_RETRY_COUNT_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function clearChunkRetryState(): void {
  try {
    sessionStorage.removeItem(CHUNK_RETRY_COUNT_KEY);
    sessionStorage.removeItem(CHUNK_RETRY_AT_KEY);
  } catch {
    /* ignore */
  }
}

/** Drop stale counters from a previous recover session (TTL). */
export function pruneStaleChunkRetryState(): void {
  try {
    const at = Number(sessionStorage.getItem(CHUNK_RETRY_AT_KEY) || 0);
    if (!at || Date.now() - at > RETRY_STATE_TTL_MS) {
      clearChunkRetryState();
    }
  } catch {
    clearChunkRetryState();
  }
}

/**
 * Call after the app stays healthy post-boot.
 * Do not call immediately after a recover reload — wait long enough to confirm chunks load.
 */
export function markAppBootHealthy(): void {
  clearChunkRetryState();
}

async function getServiceWorkerStatus(): Promise<string> {
  try {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return 'none';
    const parts = [
      reg.active ? 'active' : null,
      reg.waiting ? 'waiting' : null,
      reg.installing ? 'installing' : null,
      navigator.serviceWorker.controller ? 'controlled' : 'uncontrolled',
    ].filter(Boolean);
    return parts.join(',') || 'registered';
  } catch {
    return 'error';
  }
}

export async function logChunkRecoveryEvent(
  source: RecoverSource,
  error: unknown,
  retryCount: number
): Promise<void> {
  const payload: ChunkErrorLogPayload = {
    kind: 'chunk_load_recovery',
    source,
    message: errorMessage(error),
    name: error instanceof Error ? error.name : undefined,
    url: typeof location !== 'undefined' ? location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    appVersion: getAppVersion(),
    buildId: getBuildId(),
    retryCount,
    serviceWorker: await getServiceWorkerStatus(),
    stack: error instanceof Error ? error.stack : undefined,
  };

  // Keep console.error — not stripped by vite esbuild.pure (only log/debug/info).
  console.error('[MachineFit][chunk-recovery]', payload);

  try {
    const w = window as Window & {
      Sentry?: { captureException?: (err: unknown, ctx?: object) => void };
      gtag?: (...args: unknown[]) => void;
      dataLayer?: unknown[];
      mfAnalytics?: { track?: (name: string, data?: object) => void };
    };

    w.Sentry?.captureException?.(error instanceof Error ? error : new Error(payload.message), {
      tags: { kind: 'chunk_load_recovery', source },
      extra: payload,
    });
    void import('@/app/sentry').then(({ captureFrontendException }) =>
      captureFrontendException(error instanceof Error ? error : new Error(payload.message), {
        ...payload,
      })
    );

    w.gtag?.('event', 'chunk_load_recovery', {
      event_category: 'pwa',
      event_label: source,
      value: retryCount,
      app_version: payload.appVersion,
    });

    w.mfAnalytics?.track?.('chunk_load_recovery', payload);

    window.dispatchEvent(new CustomEvent('mf:chunk-load-recovery', { detail: payload }));
  } catch {
    /* ignore telemetry failures */
  }
}

export function setPwaUpdateHandler(fn: UpdateSW | null): void {
  updateSWFn = fn;
}

/** Register vite-plugin-pwa client (autoUpdate + skipWaiting via plugin). */
export function initPwaAutoUpdate(): void {
  if (pwaInitStarted || typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return;
  pwaInitStarted = true;

  void import('virtual:pwa-register')
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        /**
         * Default autoUpdate calls location.reload() on every SW "activated" update.
         * Debounce so a bust/unregister race cannot spin forever in Chrome.
         */
        onNeedReload() {
          try {
            const key = 'mf-sw-need-reload-at';
            const last = Number(sessionStorage.getItem(key) || 0);
            const now = Date.now();
            if (now - last < 15_000) {
              console.warn('[MachineFit][pwa] skip SW reload (debounce)');
              return;
            }
            sessionStorage.setItem(key, String(now));
          } catch {
            /* ignore */
          }
          window.location.reload();
        },
        onRegisteredSW(_swUrl, registration) {
          // Periodic check so long-lived tabs pick up deploys before next chunk miss.
          if (!registration) return;
          const hour = 60 * 60 * 1000;
          window.setInterval(() => {
            void registration.update().catch(() => undefined);
          }, hour);
        },
        onRegisterError(error) {
          console.error('[MachineFit][pwa-register]', error);
        },
      });
      setPwaUpdateHandler(updateSW);
    })
    .catch((error) => {
      console.error('[MachineFit][pwa-register-import]', error);
    });
}

export async function updateServiceWorker(): Promise<boolean> {
  try {
    if (updateSWFn) {
      // false: activate waiting worker (skipWaiting) without plugin-driven reload —
      // we clear caches then reload ourselves.
      await updateSWFn(false);
      return true;
    }

    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;

    await reg.update();

    const waiting = reg.waiting;
    if (waiting) {
      await new Promise<void>((resolve) => {
        const onController = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', onController);
          resolve();
        };
        navigator.serviceWorker.addEventListener('controllerchange', onController);
        waiting.postMessage({ type: 'SKIP_WAITING' });
        // Fallback if controllerchange never fires.
        window.setTimeout(() => {
          navigator.serviceWorker.removeEventListener('controllerchange', onController);
          resolve();
        }, 1500);
      });
      return true;
    }

    return Boolean(reg.active);
  } catch {
    return false;
  }
}

/** Last-resort: drop every SW registration so the next load fetches fresh HTML/assets. */
export async function unregisterAllServiceWorkers(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return;
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch {
    /* ignore */
  }
}

/** Drop Cache Storage (Workbox precache / runtime / old manifests). Does not touch auth storage. */
export async function clearStaleAssetCaches(): Promise<void> {
  try {
    if (!('caches' in window)) return;
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  } catch {
    /* ignore */
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** Fallback UI when React is unavailable — never shows technical error text. */
export function mountUpdateOverlayDom(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('mf-update-overlay')) return;

  const root = document.createElement('div');
  root.id = 'mf-update-overlay';
  root.setAttribute('role', 'status');
  root.style.cssText =
    'position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:1.5rem;background:#0f172a;color:#f3f4f6;font-family:system-ui,sans-serif;text-align:center;';
  root.innerHTML = `
    <div style="max-width:22rem;display:grid;gap:1rem;justify-items:center">
      <h1 style="margin:0;font-size:1.35rem;font-weight:800;line-height:1.35">🚧 머신핏 업데이트 중입니다</h1>
      <p style="margin:0;color:#9ca3af;font-size:0.95rem;line-height:1.55;white-space:pre-line">새로운 버전을 적용하고 있습니다.
잠시 후 자동으로 다시 연결됩니다.</p>
      <p id="mf-update-count" style="margin:0;font-size:3rem;font-weight:800;color:#39ff14">5</p>
      <button id="mf-update-retry" type="button" style="width:100%;min-height:48px;border:0;border-radius:10px;background:#39ff14;color:#0f172a;font-weight:700;font-size:1rem;cursor:pointer">🔄 지금 다시 시도</button>
      <button id="mf-update-home" type="button" style="width:100%;min-height:48px;border:1px solid #334155;border-radius:10px;background:#1e293b;color:#f3f4f6;font-weight:600;font-size:1rem;cursor:pointer">홈으로 이동</button>
    </div>
  `;
  document.body.appendChild(root);

  let left = Math.max(1, Math.round(CHUNK_RETRY_WAIT_MS / 1000));
  const countEl = root.querySelector('#mf-update-count');
  const tick = window.setInterval(() => {
    left -= 1;
    if (countEl) countEl.textContent = String(Math.max(0, left));
    if (left <= 0) window.clearInterval(tick);
  }, 1000);

  const retryBtn = root.querySelector('#mf-update-retry');
  retryBtn?.addEventListener('click', () => {
    void manualChunkRecover();
  });
  root.querySelector('#mf-update-home')?.addEventListener('click', () => {
    window.location.assign(import.meta.env.BASE_URL || '/');
  });

  window.setTimeout(() => {
    void manualChunkRecover();
  }, CHUNK_RETRY_WAIT_MS);
}

function bumpRetryCount(): number {
  const next = getChunkRetryCount() + 1;
  try {
    sessionStorage.setItem(CHUNK_RETRY_COUNT_KEY, String(next));
    sessionStorage.setItem(CHUNK_RETRY_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  return next;
}

/**
 * Full recovery: SW update → cache clear fallback → optional wait → reload.
 * Returns true when a reload was scheduled / performed path taken.
 * Returns false when max attempts exhausted (caller should show update UI).
 */
export async function recoverFromChunkError(
  error: unknown,
  source: RecoverSource
): Promise<'reloading' | 'show-ui'> {
  if (recoverInFlight) return 'reloading';

  const current = getChunkRetryCount();
  if (current >= MAX_CHUNK_RECOVER_ATTEMPTS) {
    await logChunkRecoveryEvent(source, error, current);
    mountUpdateOverlayDom();
    return 'show-ui';
  }

  recoverInFlight = true;
  const retryCount = bumpRetryCount();
  await logChunkRecoveryEvent(source, error, retryCount);

  try {
    // After the first soft SW update fails to unstick the tab, fully unregister.
    if (retryCount >= 2 || source === 'manual') {
      await unregisterAllServiceWorkers();
      await clearStaleAssetCaches();
    } else {
      const updated = await updateServiceWorker();
      await clearStaleAssetCaches();
      if (!updated) {
        await unregisterAllServiceWorkers();
      }
    }

    if (retryCount > 1) {
      await sleep(CHUNK_RETRY_WAIT_MS);
    }
  } catch {
    try {
      await unregisterAllServiceWorkers();
      await clearStaleAssetCaches();
    } catch {
      /* ignore */
    }
    if (retryCount > 1) {
      await sleep(CHUNK_RETRY_WAIT_MS);
    }
  }

  try {
    const url = new URL(window.location.href);
    url.searchParams.set('mf_recover', String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }

  return 'reloading';
}

/** Manual retry from the update screen (resets soft lock, keeps count semantics). */
export async function manualChunkRecover(): Promise<void> {
  recoverInFlight = false;
  const result = await recoverFromChunkError(new Error('manual_retry'), 'manual');
  if (result === 'show-ui') {
    // Force another cycle from the UI: clear count so update→reload can run again.
    clearChunkRetryState();
    recoverInFlight = false;
    await recoverFromChunkError(new Error('manual_retry_reset'), 'manual');
  }
}

export function shouldShowUpdateScreen(): boolean {
  return getChunkRetryCount() >= MAX_CHUNK_RECOVER_ATTEMPTS;
}

export function installGlobalChunkErrorHandlers(): void {
  if (listenersInstalled || typeof window === 'undefined') return;
  listenersInstalled = true;

  window.addEventListener('error', (event) => {
    const err = event.error ?? event.message;
    if (!isChunkLoadError(err) && !isChunkLoadError(event.message)) return;
    event.preventDefault();
    void recoverFromChunkError(err, 'window.onerror');
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!isChunkLoadError(event.reason)) return;
    event.preventDefault();
    void recoverFromChunkError(event.reason, 'unhandledrejection');
  });
}
