import type { WorkoutCard, WorkoutCardStatus } from '@machinefit/shared';
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

export function workoutCardToHistoryRecord(card: WorkoutCard): HistoryRecordCard {
  const logDate = normalizeDateKey(card.scheduledDate);
  return {
    cardId: `plan-${card.id}`,
    machineCode: card.machineCode,
    machineName: card.machineName ?? card.machineCode,
    brandName: card.brandName,
    muscleGroup: card.targetMuscleGroup,
    targetMuscleGroup: card.targetMuscleGroup,
    recommendationId: card.recommendationId,
    settings: card.settings ?? {},
    viewedAt: card.updatedAt || card.createdAt,
    logDate,
    planStatus: card.status,
    workoutCardId: card.id,
    isPlanOnly: true,
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
        byKey.set(key, {
          ...existing,
          planStatus: plan.status,
          workoutCardId: plan.id,
          isPlanOnly: false,
        });
      }
      continue;
    }

    if (VISIBLE_PLAN_STATUSES.includes(plan.status) || plan.status === 'COMPLETED') {
      if (existing && !existing.isPlanOnly) {
        byKey.set(key, {
          ...existing,
          planStatus: plan.status,
          workoutCardId: plan.id,
          isPlanOnly: false,
        });
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

/** Badge surface only exposes 예정 / 완료. */
export type PlanStatusBadge = 'PLANNED' | 'COMPLETED';

/**
 * Collapse workout-card statuses to the two badge values.
 * - PLANNED / IN_PROGRESS → 예정
 * - COMPLETED → 완료
 * - SKIPPED → no badge
 */
export function resolvePlanStatusBadge(
  status: WorkoutCardStatus | undefined | null
): PlanStatusBadge | null {
  if (status === 'COMPLETED') return 'COMPLETED';
  if (status === 'PLANNED' || status === 'IN_PROGRESS') return 'PLANNED';
  return null;
}

export function planStatusBadgeClass(badge: PlanStatusBadge): string {
  return badge === 'COMPLETED'
    ? 'history-record-card__plan-badge--completed'
    : 'history-record-card__plan-badge--planned';
}
