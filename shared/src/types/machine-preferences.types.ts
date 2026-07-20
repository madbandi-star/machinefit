import type { RecommendationSettings } from '../types/recommendation.types.js';

export interface MachineUserPreferences {
  customSettings: Partial<RecommendationSettings>;
  personalTipMemo: string;
}
