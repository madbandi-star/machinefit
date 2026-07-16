import type { ExperienceLevel } from '../types/api.types.js';

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
  'professional',
];

export const EXPERIENCE_WEIGHT_MULTIPLIERS: Record<ExperienceLevel, number> = {
  beginner: 0.5,
  intermediate: 0.65,
  advanced: 0.8,
  professional: 0.9,
};
