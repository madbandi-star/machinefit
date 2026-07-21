/**
 * Total volume for a workout log.
 * MachineFit stores per-set working weights; volume = Σ(setWeightsKg).
 * When setCompleted is present, only completed sets count.
 */
export function computeLogVolumeKg(
  setWeightsKg: number[],
  setCompleted?: boolean[] | null
): number {
  if (!setWeightsKg?.length) return 0;

  const useCompleted =
    Array.isArray(setCompleted) &&
    setCompleted.length === setWeightsKg.length &&
    setCompleted.some((v) => v === true);

  let total = 0;
  for (let i = 0; i < setWeightsKg.length; i += 1) {
    if (useCompleted && setCompleted![i] !== true) continue;
    const w = setWeightsKg[i];
    if (typeof w === 'number' && Number.isFinite(w) && w > 0) total += w;
  }
  return Math.round(total * 100) / 100;
}

export function formatVolumeKg(kg: number, locale = 'ko'): string {
  const safe = Math.max(0, Math.floor(kg));
  return safe.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US');
}

export function kgToTons(kg: number): number {
  return Math.round((kg / 1000) * 100) / 100;
}
