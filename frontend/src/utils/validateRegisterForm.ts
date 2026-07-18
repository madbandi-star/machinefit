import type { ExperienceLevel, Gender, UnitWeight, WorkoutGoal } from '@machinefit/shared';
import type { HomeGymValue } from '@/components/settings/HomeGymField/HomeGymField';

export type RegisterFormField =
  | 'displayName'
  | 'email'
  | 'password'
  | 'gender'
  | 'heightCm'
  | 'weightKg'
  | 'age'
  | 'workoutGoal'
  | 'homeGym'
  | 'experienceLevel';

export interface RegisterFormValues {
  displayName: string;
  email: string;
  password: string;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  age?: number;
  workoutGoal?: WorkoutGoal;
  homeGym?: HomeGymValue;
  experienceLevel?: ExperienceLevel;
  unitWeight?: UnitWeight;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_WEIGHT_KG = 30;
const MAX_WEIGHT_KG = 300;
const MIN_AGE = 13;
const MAX_AGE = 100;

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

function isAgeValid(age?: number): boolean {
  return age != null && Number.isInteger(age) && age >= MIN_AGE && age <= MAX_AGE;
}

function isHomeGymValid(homeGym?: HomeGymValue): boolean {
  if (!homeGym) return false;
  if (homeGym.homeGymId) return true;
  return Boolean(homeGym.homeGymName?.trim());
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

  if (!isAgeValid(values.age)) {
    missing.push('age');
  }

  if (!values.workoutGoal) {
    missing.push('workoutGoal');
  }

  if (!isHomeGymValid(values.homeGym)) {
    missing.push('homeGym');
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
