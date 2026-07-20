import type { ExperienceLevel } from '../types/api.types.js';

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
  'professional',
];

/**
 * Cold-start profile formula multipliers (bodyweight × factor × 0.5).
 * Tuned toward ACSM novice→advanced relative loading progression:
 * beginners ~60% effort zone; advanced/pro closer to trained working loads.
 */
export const EXPERIENCE_WEIGHT_MULTIPLIERS: Record<ExperienceLevel, number> = {
  beginner: 0.55,
  intermediate: 0.7,
  advanced: 0.85,
  professional: 0.95,
};
