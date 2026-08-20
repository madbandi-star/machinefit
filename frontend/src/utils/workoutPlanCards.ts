import type {
  RecommendationSettings,
  WorkoutCard,
  WorkoutCardStatus,
} from '@machinefit/shared';
import { normalizeDateKey } from '@/utils/historyDate';
import type { HistoryRecordCard } from '@/utils/historyRecordsDisplay';

/** Statuses shown as plan cards alongside (or instead of) history rows. */
export const VISIBLE_PLAN_STATUSES: readonly WorkoutCardStatus[] = [
  'PLANNED',
  'IN_PROGRESS',
  'SKIPPED',
];

export function buildPlanMatchKey(
  machineCode: string,
  dateKey: string,
  targetMuscleGroup?: string | null
): string {
  return `${machineCode}:${normalizeDateKey(dateKey)}:${targetMuscleGroup ?? ''}`;
}

function hasDisplaySettings(settings?: RecommendationSettings | null): boolean {
  if (!settings) return false;
  return (
    settings.recommendedWeightKg != null ||
    settings.seatPosition != null ||
    settings.recommendedRepsMin != null ||
    settings.recommendedRepsMax != null ||
    settings.backPadPosition != null ||
    settings.footPosition != null ||
    settings.handlePosition != null ||
    settings.romSetting != null
  );
}

export function workoutCardToHistoryRecord(card: WorkoutCard): HistoryRecordCard {
  const logDate = normalizeDateKey(card.scheduledDate);
  return {
    cardId: `plan-${card.id}`,
    machineCode: card.machineCode,
    machineName: card.machineName ?? card.machineCode,
    brandName: card.brandName,
    muscleGroup: card.muscleGroup,
    targetMuscleGroup: card.targetMuscleGroup,
    primaryImageUrl: card.primaryImageUrl,
    recommendationId: card.recommendationId,
    settings: card.settings ?? {},
    viewedAt: card.updatedAt || card.createdAt,
    logDate,
    planStatus: card.status,
    workoutCardId: card.id,
    isPlanOnly: true,
    planSetCount: Math.max(1, card.setCount || 1),
    planSetWeightsKg: Array.isArray(card.setWeightsKg) ? [...card.setWeightsKg] : undefined,
    planDiary: card.diary,
    planVoicePrefs: card.voicePrefs,
  };
}

/**
 * Attach plan metadata onto a history/log card without dropping plan settings.
 * Future plans often create a workout log with no recent_history row, so the
 * log-backed card has empty settings — keep recommendation settings from the plan
 * so UI stays aligned with today cards after 「셋팅값 저장하기」.
 */
function linkPlanOntoCard(existing: HistoryRecordCard, plan: WorkoutCard): HistoryRecordCard {
  const fromPlan = workoutCardToHistoryRecord(plan);
  return {
    ...existing,
    planStatus: plan.status,
    workoutCardId: plan.id,
    isPlanOnly: false,
    recommendationId: existing.recommendationId ?? plan.recommendationId,
    settings: hasDisplaySettings(existing.settings)
      ? existing.settings
      : (fromPlan.settings ?? existing.settings),
    muscleGroup: existing.muscleGroup ?? fromPlan.muscleGroup,
    brandName: existing.brandName ?? fromPlan.brandName,
    primaryImageUrl: existing.primaryImageUrl ?? fromPlan.primaryImageUrl,
    // Prefer existing (history/list locale) over plan when both present; fall back to plan.
    machineName: existing.machineName || fromPlan.machineName,
    planSetCount: fromPlan.planSetCount ?? existing.planSetCount,
    planSetWeightsKg: fromPlan.planSetWeightsKg ?? existing.planSetWeightsKg,
    planDiary: fromPlan.planDiary ?? existing.planDiary,
    planVoicePrefs: fromPlan.planVoicePrefs ?? existing.planVoicePrefs,
  };
}

/**
 * Merge workout_cards into history/log cards.
 * - PLANNED / IN_PROGRESS / SKIPPED always appear as plan cards (linked when a history row matches).
 * - COMPLETED cards that already have a matching history/log are omitted (history is source of truth).
 * - COMPLETED without a history match are still shown so orphan completions remain visible.
 */
export function mergeWorkoutPlanCards(
  historyCards: HistoryRecordCard[],
  workoutCards: WorkoutCard[]
): HistoryRecordCard[] {
  const historyKeys = new Set(
    historyCards.map((card) =>
      buildPlanMatchKey(card.machineCode, card.logDate, card.targetMuscleGroup)
    )
  );

  const byKey = new Map<string, HistoryRecordCard>();
  for (const card of historyCards) {
    byKey.set(buildPlanMatchKey(card.machineCode, card.logDate, card.targetMuscleGroup), {
      ...card,
    });
  }

  const extras: HistoryRecordCard[] = [];

  for (const plan of workoutCards) {
    const dateKey = normalizeDateKey(plan.scheduledDate);
    const key = buildPlanMatchKey(plan.machineCode, dateKey, plan.targetMuscleGroup);
    const existing = byKey.get(key);

    if (plan.status === 'COMPLETED' && historyKeys.has(key)) {
      if (existing) {
        byKey.set(key, linkPlanOntoCard(existing, plan));
      }
      continue;
    }

    if (VISIBLE_PLAN_STATUSES.includes(plan.status) || plan.status === 'COMPLETED') {
      if (existing && !existing.isPlanOnly) {
        byKey.set(key, linkPlanOntoCard(existing, plan));
      } else if (existing?.isPlanOnly) {
        byKey.set(key, workoutCardToHistoryRecord(plan));
      } else {
        extras.push(workoutCardToHistoryRecord(plan));
      }
    }
  }

  return [...byKey.values(), ...extras].sort(
    (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
  );
}

export function collectPlanDateKeys(workoutCards: WorkoutCard[]): Set<string> {
  return new Set(workoutCards.map((card) => normalizeDateKey(card.scheduledDate)));
}
