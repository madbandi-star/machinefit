/**
 * My Page feature helpers (live / achievements / lifter-dna / growth / lifted).
 * Keep Home / Search / History paths free of these — do not import from those UIs.
 */

import { computePerformedTotalWeightKg } from '@machinefit/shared';

/** YYYY-MM-DD in Asia/Seoul. */
export function seoulDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** YYYY-MM in Asia/Seoul. */
export function seoulMonthKey(date: Date = new Date()): string {
  return seoulDateKey(date).slice(0, 7);
}

/** YYYY in Asia/Seoul. */
export function seoulYearKey(date: Date = new Date()): string {
  return seoulDateKey(date).slice(0, 4);
}

/** Hour 0–23 in Asia/Seoul for an ISO timestamp. */
export function seoulHour(iso: string | Date): number {
  const raw = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    hour12: false,
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
  const hour = Number.parseInt(raw, 10);
  // en-GB may yield "24" for midnight in some engines
  if (!Number.isFinite(hour)) return 0;
  return hour === 24 ? 0 : hour;
}

export function parseWeightArray(raw: number[] | string | null | undefined): number[] {
  if (Array.isArray(raw)) return raw.map(Number).filter((n) => Number.isFinite(n));
  if (raw == null || raw === '') return [];
  try {
    const parsed = JSON.parse(String(raw)) as unknown;
    if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => Number.isFinite(n));
  } catch {
    /* ignore */
  }
  return [];
}

export function parseCompletedArray(
  raw: boolean[] | string | null | undefined
): boolean[] | null {
  if (Array.isArray(raw)) return raw.map(Boolean);
  if (raw == null || raw === '') return null;
  try {
    const parsed = JSON.parse(String(raw)) as unknown;
    if (Array.isArray(parsed)) return parsed.map(Boolean);
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Performed volume for My Page features.
 * Uses logged stepper weights (+ completed filter). Does NOT invent volume
 * from AI recommended weight when steppers are empty.
 */
export function performedVolumeFromLog(input: {
  setWeightsKg?: number[] | null;
  setCompleted?: boolean[] | null;
  setCount?: number | null;
  adjustedWeight?: number | null;
  recommendedWeight?: number | null;
  adjustedReps?: number | null;
  recommendedReps?: number | null;
}): number {
  const weights = Array.isArray(input.setWeightsKg) ? input.setWeightsKg : [];
  const hasLogged = weights.some((w) => typeof w === 'number' && Number.isFinite(w) && w > 0);
  if (!hasLogged) return 0;

  return computePerformedTotalWeightKg({
    setWeightsKg: weights,
    setCompleted: input.setCompleted,
    sets: input.setCount ?? weights.length,
    adjustedWeight: input.adjustedWeight,
    recommendedWeight: input.recommendedWeight,
    adjustedReps: input.adjustedReps,
    recommendedReps: input.recommendedReps,
  });
}

/**
 * SQL lateral join: sum logged set weights, honoring set_completed when any
 * set is marked complete. Alias outer workout_logs as `wl`; result alias `vol.kg`.
 */
export const SQL_LOG_VOLUME_LATERAL = `
LEFT JOIN LATERAL (
  WITH weights AS (
    SELECT value::numeric AS kg, ord
    FROM jsonb_array_elements_text(COALESCE(wl.set_weights_kg, '[]'::jsonb))
         WITH ORDINALITY AS t(value, ord)
  ),
  completed AS (
    SELECT (value = 'true'::jsonb) AS done, ord
    FROM jsonb_array_elements(COALESCE(wl.set_completed, '[]'::jsonb))
         WITH ORDINALITY AS t(value, ord)
  ),
  flags AS (
    SELECT COALESCE(BOOL_OR(done), FALSE) AS any_done FROM completed
  )
  SELECT COALESCE(SUM(
    CASE
      WHEN w.kg IS NULL OR w.kg <= 0 THEN 0
      WHEN NOT (SELECT any_done FROM flags) THEN w.kg
      WHEN COALESCE(c.done, FALSE) THEN w.kg
      ELSE 0
    END
  ), 0) AS kg
  FROM weights w
  LEFT JOIN completed c ON c.ord = w.ord
) vol ON TRUE
`;
