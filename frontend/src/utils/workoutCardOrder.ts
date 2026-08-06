import type { TargetMuscleGroup, WorkoutRecordDisplayOrder } from '@machinefit/shared';
import { normalizeWorkoutLogTargetMuscle } from '@machinefit/shared';

export type WorkoutCardOrderMove = 'up' | 'down' | 'top' | 'bottom';

export function buildWorkoutCardOrderKey(
  machineCode: string,
  logDate: string,
  targetMuscleGroup?: TargetMuscleGroup | string | null
): string {
  const muscle = normalizeWorkoutLogTargetMuscle(
    machineCode,
    (targetMuscleGroup as TargetMuscleGroup | undefined) ?? undefined
  );
  return `${machineCode}:${logDate}:${muscle}`;
}

export function applyWorkoutCardOrderMove<T>(
  items: T[],
  index: number,
  move: WorkoutCardOrderMove
): T[] {
  if (index < 0 || index >= items.length) return items;
  if (move === 'up' && index === 0) return items;
  if (move === 'down' && index === items.length - 1) return items;
  if (move === 'top' && index === 0) return items;
  if (move === 'bottom' && index === items.length - 1) return items;

  const next = items.slice();
  const [item] = next.splice(index, 1);
  if (!item) return items;

  if (move === 'up') next.splice(index - 1, 0, item);
  else if (move === 'down') next.splice(index + 1, 0, item);
  else if (move === 'top') next.unshift(item);
  else next.push(item);

  return next;
}

/** Sort cards within a day: saved display_order first, then viewedAt DESC fallback. */
export function sortCardsByDisplayOrder<
  T extends {
    machineCode: string;
    logDate: string;
    targetMuscleGroup?: TargetMuscleGroup;
    viewedAt: string;
  },
>(cards: T[], orders: WorkoutRecordDisplayOrder[]): T[] {
  if (cards.length <= 1) return cards;

  const orderMap = new Map<string, number>();
  for (const row of orders) {
    orderMap.set(
      buildWorkoutCardOrderKey(row.machineCode, row.logDate, row.targetMuscleGroup),
      row.displayOrder
    );
  }

  const indexed = cards.map((card, index) => ({ card, index }));
  indexed.sort((a, b) => {
    const keyA = buildWorkoutCardOrderKey(
      a.card.machineCode,
      a.card.logDate,
      a.card.targetMuscleGroup
    );
    const keyB = buildWorkoutCardOrderKey(
      b.card.machineCode,
      b.card.logDate,
      b.card.targetMuscleGroup
    );
    const orderA = orderMap.get(keyA);
    const orderB = orderMap.get(keyB);

    if (orderA !== undefined && orderB !== undefined && orderA !== orderB) {
      return orderA - orderB;
    }
    if (orderA !== undefined && orderB === undefined) return -1;
    if (orderA === undefined && orderB !== undefined) return 1;

    const timeDiff =
      new Date(b.card.viewedAt).getTime() - new Date(a.card.viewedAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.index - b.index;
  });

  return indexed.map((entry) => entry.card);
}

export function toReorderPayloadItems<
  T extends {
    machineCode: string;
    targetMuscleGroup?: TargetMuscleGroup;
  },
>(cards: T[]): { machineCode: string; targetMuscleGroup?: TargetMuscleGroup; displayOrder: number }[] {
  return cards.map((card, displayOrder) => ({
    machineCode: card.machineCode,
    ...(card.targetMuscleGroup ? { targetMuscleGroup: card.targetMuscleGroup } : {}),
    displayOrder,
  }));
}
