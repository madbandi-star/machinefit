import type { AchievementCategory, AchievementRarity } from '../types/achievement.types.js';

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  'volume',
  'reality',
  'workouts',
  'attendance',
  'time_of_day',
  'consistency',
  'pr',
  'machine',
  'muscle',
  'gym',
  'region',
  'ai',
  'challenge',
  'event',
  'hidden',
  'season',
];

export const ACHIEVEMENT_RARITIES: AchievementRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
];

export const RARITY_RANK: Record<AchievementRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

/** XP required to go from level L → L+1 (L starts at 1). */
export function xpRequiredForLevel(level: number): number {
  const safe = Math.max(1, Math.floor(level));
  return Math.round(100 + (safe - 1) * 45 + Math.pow(safe, 1.35) * 8);
}
