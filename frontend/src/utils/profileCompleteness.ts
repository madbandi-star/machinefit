import type { User } from '@machinefit/shared';

export function isHeightMissing(user: User | null | undefined): boolean {
  const height = user?.heightCm;
  return height == null || height < 100 || height > 250;
}

export function isGenderMissing(user: User | null | undefined): boolean {
  return !user?.gender;
}

export function isProfileReadyForRecommend(user: User | null | undefined): boolean {
  return !isHeightMissing(user);
}
