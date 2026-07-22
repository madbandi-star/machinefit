/** Age in full years from an ISO date string (YYYY-MM-DD), or undefined if invalid/out of range. */
export function ageFromBirthDate(
  birthDate: string | null | undefined,
  options?: { min?: number; max?: number; now?: Date }
): number | undefined {
  if (!birthDate) return undefined;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return undefined;

  const now = options?.now ?? new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }

  const min = options?.min ?? 13;
  const max = options?.max ?? 100;
  if (age < min || age > max) return undefined;
  return age;
}
