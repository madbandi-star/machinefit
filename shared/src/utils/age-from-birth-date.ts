/** Platform account minimum age (KR PIPA-aligned gate). Gym facility members may be younger. */
export const MIN_PLATFORM_AGE = 14;

/** Age in full years from YYYY-MM-DD, or undefined if invalid. No min/max clamp. */
export function yearsSinceBirthDate(
  birthDate: string | null | undefined,
  now?: Date
): number | undefined {
  if (!birthDate) return undefined;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return undefined;

  const ref = now ?? new Date();
  let age = ref.getFullYear() - birth.getFullYear();
  const monthDelta = ref.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && ref.getDate() < birth.getDate())) {
    age -= 1;
  }
  if (age < 0 || age > 130) return undefined;
  return age;
}

export function isBirthDateAtLeastMinAge(
  birthDate: string | null | undefined,
  minAge = MIN_PLATFORM_AGE,
  now?: Date
): boolean {
  const years = yearsSinceBirthDate(birthDate, now);
  return years != null && years >= minAge;
}

/** Age in full years from an ISO date string (YYYY-MM-DD), or undefined if invalid/out of range. */
export function ageFromBirthDate(
  birthDate: string | null | undefined,
  options?: { min?: number; max?: number; now?: Date }
): number | undefined {
  const age = yearsSinceBirthDate(birthDate, options?.now);
  if (age == null) return undefined;

  const min = options?.min ?? MIN_PLATFORM_AGE;
  const max = options?.max ?? 100;
  if (age < min || age > max) return undefined;
  return age;
}
