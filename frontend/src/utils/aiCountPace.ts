/**
 * AI accelerated count + turbo pacing for spoken exercise counts
 * (number reps + optional one-more cues share one schedule).
 * Pure timing helpers — does not touch timers, sets, or rest business logic.
 */

export const VOICE_COUNT_MODES = ['normal', 'ai_accel', 'ai_accel_turbo'] as const;
export type VoiceCountMode = (typeof VOICE_COUNT_MODES)[number];

export const DEFAULT_VOICE_COUNT_MODE: VoiceCountMode = 'ai_accel_turbo';

export function isVoiceCountMode(value: unknown): value is VoiceCountMode {
  return typeof value === 'string' && (VOICE_COUNT_MODES as readonly string[]).includes(value);
}

export function clampVoiceCountMode(value: unknown): VoiceCountMode {
  return isVoiceCountMode(value) ? value : DEFAULT_VOICE_COUNT_MODE;
}

/**
 * Turbo window size from total exercise counts (reps ≈ seconds of counting).
 * Spec:
 *  ~30 → last 5
 *  ~45 → last 8
 *  ~60 → last 10
 *  90+ → last ~15–20%
 */
export function resolveTurboCount(totalCounts: number): number {
  const n = Math.max(0, Math.floor(totalCounts));
  if (n <= 0) return 0;
  if (n <= 12) return Math.max(2, Math.round(n * 0.25));
  if (n <= 35) return Math.min(n, 5);
  if (n <= 50) return Math.min(n, 8);
  if (n <= 75) return Math.min(n, 10);
  const pct = n >= 120 ? 0.18 : 0.16;
  return Math.min(n, Math.max(1, Math.round(n * pct)));
}

/** Smoothstep 0→1 for gradual (never abrupt) acceleration. */
function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export interface CountPaceStep {
  /** Gap after this count before the next (ms). 0 after last. */
  gapAfterMs: number;
  /** True when this count is inside the turbo window. */
  turbo: boolean;
  /** 0–1 intensity for UI/haptics (rises through the set). */
  intensity: number;
}

export interface BuildCountPaceOptions {
  totalCounts: number;
  /** User base gap (normal tempo). */
  baseGapMs: number;
  mode: VoiceCountMode;
  minGapMs?: number;
}

/**
 * Build per-count gap schedule.
 * - normal: constant base gap
 * - ai_accel: gradual shorten toward ~55% of base by the last count
 * - ai_accel_turbo: same accel, then turbo window shortens further (~38%→~32% of base)
 */
export function buildCountPaceSchedule(options: BuildCountPaceOptions): CountPaceStep[] {
  const total = Math.max(0, Math.floor(options.totalCounts));
  const base = Math.max(200, Math.round(options.baseGapMs));
  const minGap = Math.max(200, options.minGapMs ?? 800);
  const mode = clampVoiceCountMode(options.mode);

  if (total <= 0) return [];

  if (mode === 'normal') {
    return Array.from({ length: total }, (_, i) => ({
      gapAfterMs: i < total - 1 ? base : 0,
      turbo: false,
      intensity: total <= 1 ? 1 : i / (total - 1),
    }));
  }

  const turboCount = mode === 'ai_accel_turbo' ? resolveTurboCount(total) : 0;
  const accelLen = Math.max(0, total - turboCount);
  const accelEndGap = Math.max(minGap, Math.round(base * 0.55));
  const turboStartGap = Math.max(minGap, Math.round(base * 0.38));
  const turboEndGap = Math.max(minGap, Math.round(base * 0.32));

  const steps: CountPaceStep[] = [];
  for (let i = 0; i < total; i += 1) {
    const inTurbo = turboCount > 0 && i >= accelLen;
    let gap = base;

    if (inTurbo) {
      if (turboCount <= 1) {
        gap = turboEndGap;
      } else {
        const t = (i - accelLen) / (turboCount - 1);
        gap = Math.round(turboStartGap + (turboEndGap - turboStartGap) * smoothstep(t));
      }
    } else if (accelLen <= 1) {
      gap = accelEndGap;
    } else {
      const t = i / (accelLen - 1);
      // Ease-in: stays closer to base early, then gently pulls toward accelEnd.
      gap = Math.round(base + (accelEndGap - base) * smoothstep(t));
    }

    gap = Math.max(minGap, Math.min(base, gap));
    const intensity = total <= 1 ? 1 : i / (total - 1);
    steps.push({
      gapAfterMs: i < total - 1 ? gap : 0,
      turbo: inTurbo,
      intensity,
    });
  }

  // Guarantee monotonic-ish acceleration: each non-turbo gap should not grow.
  for (let i = 1; i < accelLen; i += 1) {
    if (steps[i].gapAfterMs > steps[i - 1].gapAfterMs && i < total - 1) {
      steps[i] = {
        ...steps[i],
        gapAfterMs: steps[i - 1].gapAfterMs,
      };
    }
  }

  return steps;
}

export function formatCountDisplay(rep: number, turbo: boolean): string {
  if (rep <= 0) return '';
  if (!turbo) return String(rep);
  // Final turbo beats get stronger punctuation for visual tension only (voice unchanged).
  return `${rep}!`;
}
