import { BRAND_CODES } from '@machinefit/shared';

/**
 * Default muscle filter on machine search: all muscles.
 * `null` means no muscleGroup query param (전체).
 */
export const DEFAULT_SEARCH_MUSCLE_GROUP: string | null = null;

/**
 * Default brand filter for **guests** when entering machine search with no `brand` param.
 * Logged-in users default to “전체” (`brand=all` → null) so the first paint is not stuck on
 * 맨몸 (often outside favorite brands / empty catalog) before favorites resolve.
 * Guests can still pick “전체” (`brand=all` → null).
 */
export const DEFAULT_SEARCH_BRAND_CODE: string | null = BRAND_CODES.BODYWEIGHT;

/** Brand code used for the short “맨몸” chip label. */
export const SEARCH_BODYWEIGHT_BRAND_CODE = BRAND_CODES.BODYWEIGHT;
