/** Platform account minimum age (KR PIPA-aligned gate). Gym facility members may be younger. */
export const MIN_PLATFORM_AGE = 14;

/** Civil age (만 나이) is computed in this timezone, not the server/browser local zone. */
export const AGE_CALC_TIMEZONE = 'Asia/Seoul';

export const ISO_DATE_YMD = /^\d{4}-\d{2}-\d{2}$/;

type Ymd = { y: number; m: number; d: number };

function parseBirthYmd(birthDate: string): Ymd | undefined {
  if (!ISO_DATE_YMD.test(birthDate)) return undefined;
  const y = Number(birthDate.slice(0, 4));
  const m = Number(birthDate.slice(5, 7));
  const d = Number(birthDate.slice(8, 10));
  const utc = new Date(Date.UTC(y, m - 1, d));
  if (utc.getUTCFullYear() !== y || utc.getUTCMonth() !== m - 1 || utc.getUTCDate() !== d) {
    return undefined;
  }
  return { y, m, d };
}

/** Calendar Y-M-D of an instant in `timeZone` (default Asia/Seoul). */
export function calendarDateInTimeZone(
  instant: Date,
  timeZone = AGE_CALC_TIMEZONE
): Ymd | undefined {
  if (Number.isNaN(instant.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const y = num('year');
  const m = num('month');
  const d = num('day');
  if (!y || !m || !d) return undefined;
  return { y, m, d };
}

/** Full years from YYYY-MM-DD using Asia/Seoul as of `now`, or undefined if invalid. */
export function yearsSinceBirthDate(
  birthDate: string | null | undefined,
  now?: Date
): number | undefined {
  if (!birthDate) return undefined;
  const birth = parseBirthYmd(birthDate);
  if (!birth) return undefined;

  const ref = calendarDateInTimeZone(now ?? new Date());
  if (!ref) return undefined;

  let age = ref.y - birth.y;
  if (ref.m < birth.m || (ref.m === birth.m && ref.d < birth.d)) {
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
