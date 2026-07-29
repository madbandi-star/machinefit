import { BRAND_CODES, type TargetMuscleGroup } from '@machinefit/shared';

/** Default muscle filter on machine search (등). */
export const DEFAULT_SEARCH_MUSCLE_GROUP: TargetMuscleGroup = 'back';

/**
 * Default brand filter on machine search: all brands.
 * `null` means no brandCode query param (전체).
 */
export const DEFAULT_SEARCH_BRAND_CODE: string | null = null;

/** Brand code used for the short “맨몸” chip label. */
export const SEARCH_BODYWEIGHT_BRAND_CODE = BRAND_CODES.BODYWEIGHT;
