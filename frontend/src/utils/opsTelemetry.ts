import { API_BASE_URL } from '@/services/http/axios-client';
import { useAuthStore } from '@/store/auth.store';
import type { OpsIngestEvent, OpsSeverity } from '@machinefit/shared';

const SESSION_KEY = 'mf_ops_session_id';
const QUEUE_MAX = 40;
const FLUSH_MS = 8_000;

let queue: OpsIngestEvent[] = [];
let flushTimer: number | null = null;
let installed = false;
let lastPath: string | null = null;
let pathEnteredAt = Date.now();

function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

function deviceInfo() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  return {
    browser: ua.slice(0, 120),
    os: /Windows/i.test(ua)
      ? 'Windows'
      : /Mac OS|Macintosh/i.test(ua)
        ? 'macOS'
        : /Android/i.test(ua)
          ? 'Android'
          : /iPhone|iPad/i.test(ua)
            ? 'iOS'
            : 'Other',
    device: isMobile ? 'mobile' : 'desktop',
    appVersion: import.meta.env.VITE_APP_VERSION || '0.1.0',
  };
}

function isProdCollection(): boolean {
  return import.meta.env.PROD === true;
}

function enqueue(event: OpsIngestEvent): void {
  // Dev: keep only errors (minimal noise / no perf cost).
  if (!isProdCollection() && event.type !== 'error') return;

  queue.push({
    ...event,
    sessionId: event.sessionId ?? sessionId(),
    ...deviceInfo(),
    occurredAt: event.occurredAt ?? new Date().toISOString(),
  });
  if (queue.length >= QUEUE_MAX) {
    void flushOpsQueue();
    return;
  }
  if (flushTimer == null) {
    flushTimer = window.setTimeout(() => {
      flushTimer = null;
      void flushOpsQueue();
    }, FLUSH_MS);
  }
}

export async function flushOpsQueue(): Promise<void> {
  if (!queue.length) return;
  const batch = queue.splice(0, QUEUE_MAX);
  try {
    const token = useAuthStore.getState().tokens?.accessToken;
    await fetch(`${API_BASE_URL}/ops/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
  } catch {
    // Drop on failure — never block UX. Re-queue lightly in prod noise.
    if (import.meta.env.PROD && batch.length < 10) {
      queue.unshift(...batch);
    }
  }
}

export function trackPageView(pathKey: string, opts?: { entrance?: boolean }): void {
  const now = Date.now();
  if (lastPath && lastPath !== pathKey) {
    enqueue({
      type: 'page_view',
      pathKey: lastPath,
      dwellMs: Math.max(0, now - pathEnteredAt),
      isExit: true,
      isBounce: now - pathEnteredAt < 3000,
    });
  }
  lastPath = pathKey;
  pathEnteredAt = now;
  enqueue({
    type: 'page_view',
    pathKey,
    isEntrance: opts?.entrance ?? !document.referrer,
    dwellMs: 0,
  });
  enqueue({ type: 'session_ping', pathKey });
}

export function trackFeature(featureKey: string, meta?: Record<string, unknown>): void {
  enqueue({ type: 'feature', featureKey, meta });
}

export function trackOpsError(input: {
  title: string;
  message?: string;
  stack?: string;
  severity?: OpsSeverity;
  source?: string;
  url?: string;
  meta?: Record<string, unknown>;
}): void {
  enqueue({
    type: 'error',
    pathKey: typeof location !== 'undefined' ? location.pathname : undefined,
    error: {
      title: input.title.slice(0, 400),
      message: input.message?.slice(0, 2000),
      stack: input.stack?.slice(0, 8000),
      severity: input.severity ?? 'medium',
      source: input.source ?? 'frontend',
      url: input.url ?? (typeof location !== 'undefined' ? location.href : undefined),
    },
    meta: input.meta,
  });
  void flushOpsQueue();
}

/** Install global error / rejection / page lifecycle collectors once. */
export function installOpsTelemetry(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    // Resource errors (img/script/css) are handled in the capture listener below.
    if (event.target && event.target !== window) return;
    const err = event.error;
    trackOpsError({
      title: err?.name || 'WindowError',
      message: err?.message || event.message,
      stack: err?.stack,
      severity: 'high',
      source: 'frontend',
      meta: { filename: event.filename, lineno: event.lineno },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    trackOpsError({
      title: 'UnhandledRejection',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      severity: 'high',
      source: 'frontend',
    });
  });

  // Image load failures (capture phase so we see resource errors).
  window.addEventListener(
    'error',
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target || target === (window as unknown as HTMLElement)) return;
      if (target.tagName === 'IMG') {
        trackOpsError({
          title: 'ImageLoadError',
          message: (target as HTMLImageElement).currentSrc || (target as HTMLImageElement).src,
          severity: 'low',
          source: 'frontend',
        });
      }
    },
    true
  );

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('error', () => {
      trackOpsError({
        title: 'ServiceWorkerError',
        message: 'Service worker error event',
        severity: 'medium',
        source: 'pwa',
      });
    });
  }

  window.addEventListener('appinstalled', () => {
    trackFeature('pwa_install');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (lastPath) {
        enqueue({
          type: 'page_view',
          pathKey: lastPath,
          dwellMs: Math.max(0, Date.now() - pathEnteredAt),
          isExit: true,
        });
      }
      void flushOpsQueue();
    }
  });

  window.addEventListener('beforeunload', () => {
    void flushOpsQueue();
  });

  // Heartbeat for "current online"
  window.setInterval(() => {
    enqueue({
      type: 'session_ping',
      pathKey: typeof location !== 'undefined' ? location.pathname : undefined,
    });
    void flushOpsQueue();
  }, 60_000);
}
