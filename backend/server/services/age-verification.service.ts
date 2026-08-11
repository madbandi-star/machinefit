/**
 * Platform-account age gate (KR PIPA: under-14 needs guardian consent).
 * Phase 1 is self-declared birth date only — no identity-verification vendor.
 * Do not log the raw birth date.
 */
import { MIN_PLATFORM_AGE, yearsSinceBirthDate } from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';

/** Reserved for a future contracted identity check. Not implemented. */
export type PlatformAgeVerificationMethod = 'self_declared';

export function assertPlatformAgeEligible(
  birthDate: string,
  now?: Date
): { ageYears: number; method: PlatformAgeVerificationMethod } {
  const ageYears = yearsSinceBirthDate(birthDate, now);
  if (ageYears == null) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid birth date');
  }
  if (ageYears < MIN_PLATFORM_AGE) {
    throw new AppError(403, 'AGE_RESTRICTED', 'Must be at least 14 years old');
  }
  return { ageYears, method: 'self_declared' };
}
