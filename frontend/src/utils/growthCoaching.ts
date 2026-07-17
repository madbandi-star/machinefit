import type { TFunction } from 'i18next';
import type { WorkoutInsightsCoaching } from '@machinefit/shared';

const COACHING_PREFIX = 'growthAnalysis.insights.coaching';

export function getCoachingSummary(
  t: TFunction,
  coaching: WorkoutInsightsCoaching
): string {
  const key = `${COACHING_PREFIX}.summary.${coaching.focus}.${coaching.comparisonLevel}`;
  return t(key);
}

export function getCoachingTips(
  t: TFunction,
  coaching: WorkoutInsightsCoaching
): string[] {
  const tips: string[] = [];
  tips.push(t(`${COACHING_PREFIX}.tips.${coaching.focus}`));

  if (coaching.plateau) {
    tips.push(t(`${COACHING_PREFIX}.tips.plateau`));
  }

  if (coaching.lowFrequency) {
    tips.push(t(`${COACHING_PREFIX}.tips.lowFrequency`));
  }

  if (coaching.comparisonLevel === 'above') {
    tips.push(t(`${COACHING_PREFIX}.tips.abovePeer`));
  } else if (coaching.comparisonLevel === 'below') {
    tips.push(t(`${COACHING_PREFIX}.tips.belowPeer`));
  }

  return [...new Set(tips)];
}

export function getCoachingFocusLabel(t: TFunction, focus: WorkoutInsightsCoaching['focus']): string {
  return t(`${COACHING_PREFIX}.focusLabel.${focus}`);
}
