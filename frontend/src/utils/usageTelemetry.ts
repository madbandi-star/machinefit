import type { UsageFeatureCode } from '@machinefit/shared';
import { isUsageFeatureCode } from '@machinefit/shared';
import { usageApi } from '@/api/usage.api';
import { useAuthStore } from '@/store/auth.store';

type Queued = { featureCode: UsageFeatureCode; amount: number };

const queue: Queued[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush(): void {
  flushTimer = null;
  if (!queue.length) return;
  if (!useAuthStore.getState().tokens?.accessToken) {
    queue.length = 0;
    return;
  }
  const events = queue.splice(0, queue.length);
  void usageApi.track(events).catch(() => {
    /* non-blocking */
  });
}

/** Client-side usage events (timer/voice/insight/lab). Batched, auth-only, non-blocking. */
export function trackUsage(featureCode: string, amount = 1): void {
  if (!isUsageFeatureCode(featureCode) || amount <= 0) return;
  if (!useAuthStore.getState().tokens?.accessToken) return;
  queue.push({ featureCode, amount: Math.min(amount, 100) });
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 800);
}

/** Map My Page insight/lab routes to usage feature codes (once per visit). */
export function trackUsageForPath(pathname: string): void {
  const map: Array<[RegExp, UsageFeatureCode]> = [
    [/^\/lifter-dna/, 'insight_lifter_dna'],
    [/^\/growth-timeline/, 'insight_growth_timeline'],
    [/^\/growth-analysis/, 'insight_growth_analysis'],
    [/^\/lifted-weight/, 'insight_lifted_weight'],
    [/^\/achievements/, 'insight_achievements'],
    [/^\/live/, 'lab_live_dashboard'],
    [/^\/my-page\/lab/, 'lab_open'],
  ];
  for (const [re, code] of map) {
    if (re.test(pathname)) {
      trackUsage(code);
      return;
    }
  }
}
