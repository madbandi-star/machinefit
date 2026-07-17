import type { TFunction } from 'i18next';
import type { WorkoutInsightsCoaching } from '@machinefit/shared';

export function getCoachingSummary(
  t: TFunction,
  coaching: WorkoutInsightsCoaching,
  viewMode: 'machine' | 'daily' = 'machine'
): string {
  const prefix =
    viewMode === 'daily'
      ? 'growthAnalysis.daily.insights.coaching'
      : 'growthAnalysis.insights.coaching';
  const key = `${prefix}.summary.${coaching.focus}.${coaching.comparisonLevel}`;
  return t(key);
}

export function getCoachingTips(
  t: TFunction,
  coaching: WorkoutInsightsCoaching,
  viewMode: 'machine' | 'daily' = 'machine'
): string[] {
  const prefix =
    viewMode === 'daily'
      ? 'growthAnalysis.daily.insights.coaching'
      : 'growthAnalysis.insights.coaching';
  const tips: string[] = [];
  tips.push(t(`${prefix}.tips.${coaching.focus}`));

  if (coaching.plateau) {
    tips.push(t(`${prefix}.tips.plateau`));
  }

  if (coaching.lowFrequency) {
    tips.push(t(`${prefix}.tips.lowFrequency`));
  }

  if (coaching.comparisonLevel === 'above') {
    tips.push(t(`${prefix}.tips.abovePeer`));
  } else if (coaching.comparisonLevel === 'below') {
    tips.push(t(`${prefix}.tips.belowPeer`));
  }

  return [...new Set(tips)];
}

export function getCoachingFocusLabel(
  t: TFunction,
  focus: WorkoutInsightsCoaching['focus'],
  viewMode: 'machine' | 'daily' = 'machine'
): string {
  const prefix =
    viewMode === 'daily'
      ? 'growthAnalysis.daily.insights.coaching'
      : 'growthAnalysis.insights.coaching';
  return t(`${prefix}.focusLabel.${focus}`);
}
