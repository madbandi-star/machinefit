import type { ExperienceLevel, Gender, UnitWeight } from '@machinefit/shared';

export type RegisterFormField =
  | 'displayName'
  | 'email'
  | 'password'
  | 'gender'
  | 'heightCm'
  | 'weightKg'
  | 'experienceLevel';

export interface RegisterFormValues {
  displayName: string;
  email: string;
  password: string;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  experienceLevel?: ExperienceLevel;
  unitWeight?: UnitWeight;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_WEIGHT_KG = 30;
const MAX_WEIGHT_KG = 300;

function isHeightValid(heightCm?: number): boolean {
  return heightCm != null && Number.isFinite(heightCm) && heightCm >= 100 && heightCm <= 250;
}

function isWeightValid(weightKg?: number): boolean {
  return (
    weightKg != null &&
    Number.isFinite(weightKg) &&
    weightKg >= MIN_WEIGHT_KG &&
    weightKg <= MAX_WEIGHT_KG
  );
}

export function getMissingRegisterFields(values: RegisterFormValues): RegisterFormField[] {
  const missing: RegisterFormField[] = [];
  const displayName = values.displayName.trim();
  const email = values.email.trim();

  if (!displayName || displayName.length < 2) {
    missing.push('displayName');
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    missing.push('email');
  }

  if (!values.password || values.password.length < 8) {
    missing.push('password');
  }

  if (!values.gender) {
    missing.push('gender');
  }

  if (!isHeightValid(values.heightCm)) {
    missing.push('heightCm');
  }

  if (!isWeightValid(values.weightKg)) {
    missing.push('weightKg');
  }

  if (!values.experienceLevel) {
    missing.push('experienceLevel');
  }

  return missing;
}

export function getWeightRangeHint(unitWeight: UnitWeight = 'kg'): string {
  if (unitWeight === 'lb') {
    return '66–660';
  }
  return '30–300';
}
