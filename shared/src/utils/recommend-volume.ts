const RECOMMEND_VOLUME_STEP_KG = 50;

/** Round up to the nearest 50 kg step. */
export function roundRecommendVolumeKg(value: number): number {
  if (value <= 0) return 0;
  return Math.ceil(value / RECOMMEND_VOLUME_STEP_KG) * RECOMMEND_VOLUME_STEP_KG;
}

/** Progressive overload target for daily total volume (+10% or at least 50 kg). */
export function nextRecommendVolumeKg(currentVolumeKg: number): number {
  if (currentVolumeKg <= 0) return 500;

  const increment = Math.max(Math.round(currentVolumeKg * 0.1), 50);
  return roundRecommendVolumeKg(currentVolumeKg + increment);
}
