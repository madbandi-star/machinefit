export const HEIGHT_PEER_RANGE_CM = 5;
export const MIN_BODY_WEIGHT_KG = 30;
export const MAX_BODY_WEIGHT_KG = 300;
export const MIN_BODY_HEIGHT_CM = 100;
export const MAX_BODY_HEIGHT_CM = 250;

export function getPeerHeightRange(heightCm: number): { heightMinCm: number; heightMaxCm: number } {
  return {
    heightMinCm: Math.max(MIN_BODY_HEIGHT_CM, heightCm - HEIGHT_PEER_RANGE_CM),
    heightMaxCm: Math.min(MAX_BODY_HEIGHT_CM, heightCm + HEIGHT_PEER_RANGE_CM),
  };
}

export function hasGrowthBodyProfile(user: {
  gender?: string;
  heightCm?: number;
  weightKg?: number;
}): boolean {
  return Boolean(
    user.gender &&
      user.heightCm != null &&
      user.heightCm >= MIN_BODY_HEIGHT_CM &&
      user.heightCm <= MAX_BODY_HEIGHT_CM &&
      user.weightKg != null &&
      user.weightKg >= MIN_BODY_WEIGHT_KG &&
      user.weightKg <= MAX_BODY_WEIGHT_KG
  );
}
