import type { RecommendationSettings } from '@machinefit/shared';
import type { IconName } from '@/components/icons/Icon';

export const HISTORY_SETTING_ICON: Partial<Record<keyof RecommendationSettings, IconName>> = {
  recommendedWeightKg: 'weightStack',
  recommendedRepsMin: 'sliders',
  seatPosition: 'barbell',
  backPadPosition: 'seatBack',
  footPosition: 'barbell',
  handlePosition: 'cableHandle',
  romSetting: 'sliders',
};
