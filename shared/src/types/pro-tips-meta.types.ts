export type ProTipsVerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'BRAND_MODEL_NOT_FOUND'
  | 'exercise_guidance_only';

/** Admin / import metadata — not required for public recommendation UI. */
export interface ProTipsMeta {
  verificationStatus: ProTipsVerificationStatus;
  verifiedModel?: string | null;
  manufacturer?: string | null;
  productSeries?: string | null;
  sourceUrl?: string | null;
  verifiedStructure?: string | null;
  verifiedAdjustments?: string | null;
  importedAt?: string;
}
