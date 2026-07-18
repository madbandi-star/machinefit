import type { LucideIcon } from 'lucide-react';
import {
  Armchair,
  Dumbbell,
  GripVertical,
  Layers3,
  MoveHorizontal,
  Package,
} from 'lucide-react';
import type { RecommendationSettings } from '@machinefit/shared';

export const HISTORY_LUCIDE_SETTING_ICON: Partial<
  Record<keyof RecommendationSettings, LucideIcon>
> = {
  recommendedWeightKg: Dumbbell,
  seatPosition: Armchair,
  backPadPosition: Layers3,
  footPosition: Armchair,
  handlePosition: GripVertical,
  romSetting: MoveHorizontal,
};

export const HISTORY_TOTAL_WEIGHT_ICON = Package;
