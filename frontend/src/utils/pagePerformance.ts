/**
 * Page landing performance instrumentation (dev / opt-in only).
 * Logs PAGE_PERFORMANCE — never tokens, PII, or response bodies.
 * Production: enable with localStorage `mf_page_perf=1` or VITE_PAGE_PERF_LOG=1.
 * Uses console.warn so Vite `esbuild.pure` (strips console.info) does not drop it.
 */
type PagePerfSession = {
  path: string;
  navStart: number;
  reactMountMs: number | null;
  firstRenderMs: number | null;
  apiMs: number;
  imageMs: number;
  apiInflight: number;
  imageInflight: number;
  finalized: boolean;
  settleTimer: number | null;
};

let session: PagePerfSession | null = null;
let bootMarked = false;
let resourceObserver: PerformanceObserver | null = null;

function storageFlag(): boolean {
  try {
    return localStorage.getItem('mf_page_perf') === '1';
  } catch {
    return false;
  }
}

export function isPagePerfEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_PAGE_PERF_LOG === '1' || import.meta.env.VITE_PAGE_PERF_LOG === 'true') {
    return true;
  }
  // Opt-in only (intended for admins / ops). Never on by default in production.
  return storageFlag();
}

function navTimingMs(): number {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (!nav) return Math.round(performance.now());
  return Math.round(nav.responseEnd || nav.domContentLoadedEventEnd || performance.now());
}

/** Navigation Timing breakdown for cold document loads (SPA soft nav → ~0). */
function navBreakdownLines(): string[] {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (!nav) {
    return ['dns=0 ms', 'connection=0 ms', 'response=0 ms', 'dom_loading=0 ms'];
  }
  const dns = Math.max(0, Math.round(nav.domainLookupEnd - nav.domainLookupStart));
  const connection = Math.max(0, Math.round(nav.connectEnd - nav.connectStart));
  const response = Math.max(0, Math.round(nav.responseEnd - nav.requestStart));
  const domLoading = Math.max(0, Math.round(nav.domContentLoadedEventEnd - nav.responseEnd));
  return [
    `dns=${dns} ms`,
    `connection=${connection} ms`,
    `response=${response} ms`,
    `dom_loading=${domLoading} ms`,
  ];
}

function emit(s: PagePerfSession, reason: 'settle' | 'leave'): void {
  if (s.finalized) return;
  s.finalized = true;
  if (s.settleTimer != null) {
    window.clearTimeout(s.settleTimer);
    s.settleTimer = null;
  }
  const total = Math.round(performance.now() - s.navStart);
  const first = s.firstRenderMs ?? total;
  const final = total;
  // Prefer warn: survives Vite production pure-list; gated by isPagePerfEnabled.
  // eslint-disable-next-line no-console
  console.warn(
    [
      'PAGE_PERFORMANCE',
      `page=${s.path}`,
      `navigation=${navTimingMs()} ms`,
      ...navBreakdownLines(),
      `react_mount=${s.reactMountMs ?? 0} ms`,
      `first_render=${first} ms`,
      `api_total=${Math.round(s.apiMs)} ms`,
      `image_total=${Math.round(s.imageMs)} ms`,
      `final_render=${final} ms`,
      `total=${total} ms`,
      `reason=${reason}`,
    ].join('\n')
  );
}

function scheduleSettle(s: PagePerfSession): void {
  if (s.settleTimer != null) window.clearTimeout(s.settleTimer);
  s.settleTimer = window.setTimeout(() => {
    if (s.apiInflight > 0 || s.imageInflight > 0) {
      scheduleSettle(s);
      return;
    }
    emit(s, 'settle');
  }, 450);
}

function ensureResourceObserver(): void {
  if (resourceObserver || typeof PerformanceObserver === 'undefined') return;
  try {
    resourceObserver = new PerformanceObserver((list) => {
      if (!session || !isPagePerfEnabled()) return;
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceResourceTiming;
        if (e.initiatorType !== 'img' && e.initiatorType !== 'css' && e.initiatorType !== 'link') {
          continue;
        }
        if (e.initiatorType === 'img' || /image|\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(e.name)) {
          session.imageMs += e.duration || 0;
        }
      }
    });
    resourceObserver.observe({ type: 'resource', buffered: true });
  } catch {
    resourceObserver = null;
  }
}

/** Call once after React root render. */
export function markReactMounted(): void {
  if (!isPagePerfEnabled() || bootMarked) return;
  bootMarked = true;
  ensureResourceObserver();
  if (!session) {
    session = {
      path: `${window.location.pathname}${window.location.search ? '?…' : ''}`.slice(0, 200),
      navStart: 0,
      reactMountMs: Math.round(performance.now()),
      firstRenderMs: null,
      apiMs: 0,
      imageMs: 0,
      apiInflight: 0,
      imageInflight: 0,
      finalized: false,
      settleTimer: null,
    };
  } else {
    session.reactMountMs = Math.round(performance.now() - session.navStart);
  }
}

/** Start timing for a route change (or first paint). */
export function startPagePerf(pathKey: string): void {
  if (!isPagePerfEnabled()) return;
  ensureResourceObserver();
  if (session && !session.finalized) emit(session, 'leave');
  session = {
    path: pathKey.slice(0, 200),
    navStart: performance.now(),
    reactMountMs: bootMarked ? 0 : null,
    firstRenderMs: null,
    apiMs: 0,
    imageMs: 0,
    apiInflight: 0,
    imageInflight: 0,
    finalized: false,
    settleTimer: null,
  };
  // First paint approx: next frame after route effect.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!session || session.finalized || session.firstRenderMs != null) return;
      session.firstRenderMs = Math.round(performance.now() - session.navStart);
      scheduleSettle(session);
    });
  });
}

export function trackPageApiStart(): void {
  if (!session || session.finalized || !isPagePerfEnabled()) return;
  session.apiInflight += 1;
}

export function trackPageApiEnd(durationMs: number): void {
  if (!session || !isPagePerfEnabled()) return;
  session.apiInflight = Math.max(0, session.apiInflight - 1);
  if (durationMs > 0) session.apiMs += durationMs;
  if (!session.finalized) scheduleSettle(session);
}

export function trackPageImage(durationMs: number): void {
  if (!session || session.finalized || !isPagePerfEnabled()) return;
  if (durationMs > 0) session.imageMs += durationMs;
  scheduleSettle(session);
}
