import type { TFunction } from 'i18next';
import type { WorkoutInsightsCoaching } from '@machinefit/shared';

export function getCoachingSummary(
  t: TFunction,
  coaching: WorkoutInsightsCoaching
): string {
  const key = `growthAnalysis.coaching.summary.${coaching.focus}.${coaching.comparisonLevel}`;
  return t(key);
}

export function getCoachingTips(
  t: TFunction,
  coaching: WorkoutInsightsCoaching
): string[] {
  const tips: string[] = [];
  tips.push(t(`growthAnalysis.coaching.tips.${coaching.focus}`));

  if (coaching.plateau) {
    tips.push(t('growthAnalysis.coaching.tips.plateau'));
  }

  if (coaching.lowFrequency) {
    tips.push(t('growthAnalysis.coaching.tips.lowFrequency'));
  }

  if (coaching.comparisonLevel === 'above') {
    tips.push(t('growthAnalysis.coaching.tips.abovePeer'));
  } else if (coaching.comparisonLevel === 'below') {
    tips.push(t('growthAnalysis.coaching.tips.belowPeer'));
  }

  return tips;
}

export function getCoachingFocusLabel(t: TFunction, focus: WorkoutInsightsCoaching['focus']): string {
  return t(`growthAnalysis.coaching.focusLabel.${focus}`);
}
