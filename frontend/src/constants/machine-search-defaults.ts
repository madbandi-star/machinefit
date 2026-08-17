import { BRAND_CODES } from '@machinefit/shared';

/**
 * Default muscle filter on machine search: all muscles.
 * `null` means no muscleGroup query param (전체).
 */
export const DEFAULT_SEARCH_MUSCLE_GROUP: string | null = null;

/**
 * Default brand filter when entering machine search with no `brand` param.
 * `null` = 전체. Explicit URL uses `brand=all` so the entry effect does not re-apply a default.
 */
export const DEFAULT_SEARCH_BRAND_CODE: string | null = null;

/** Brand code used for the short “맨몸” chip label. */
export const SEARCH_BODYWEIGHT_BRAND_CODE = BRAND_CODES.BODYWEIGHT;
