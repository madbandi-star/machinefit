import type { HistoryItem } from '@/api';
import type { TargetMuscleGroup, WorkoutLog } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { getLocalDateKey, normalizeDateKey } from '@/utils/historyDate';
import { buildLoggedWorkoutKey } from '@/utils/historyLogStatus';
import type { HistoryLogStatus } from '@/utils/historyLogStatus';

export interface HistoryRecordCard {
  cardId: string;
  historyId?: string;
  machineCode: string;
  machineName: string;
  muscleGroup?: string;
  targetMuscleGroup?: TargetMuscleGroup;
  recommendationId?: string;
  settings: HistoryItem['settings'];
  viewedAt: string;
  logDate: string;
}

function buildFreeWeightCardKey(
  machineCode: string,
  logDate: string,
  targetMuscleGroup: string
): string {
  return `${machineCode}:${logDate}:${targetMuscleGroup}`;
}

function findHistoryForFreeWeightCard(
  historyItems: HistoryItem[],
  machineCode: string,
  logDate: string,
  targetMuscleGroup: TargetMuscleGroup,
  recommendationId?: string
): HistoryItem | undefined {
  const sameDay = historyItems.filter(
    (item) => item.machineCode === machineCode && getLocalDateKey(item.viewedAt) === logDate
  );

  return (
    sameDay.find((item) => item.targetMuscleGroup === targetMuscleGroup) ??
    (recommendationId
      ? sameDay.find((item) => item.recommendationId === recommendationId)
      : undefined) ??
    sameDay[0]
  );
}

export function expandHistoryRecordCards(
  historyItems: HistoryItem[],
  workoutLogs: WorkoutLog[]
): HistoryRecordCard[] {
  const cards: HistoryRecordCard[] = [];
  const freeWeightKeys = new Set<string>();

  for (const item of historyItems) {
    if (isFreeWeightMachineCode(item.machineCode)) continue;

    cards.push({
      cardId: item.id,
      historyId: item.id,
      machineCode: item.machineCode,
      machineName: item.machineName,
      muscleGroup: item.muscleGroup,
      recommendationId: item.recommendationId,
      settings: item.settings,
      viewedAt: item.viewedAt,
      logDate: getLocalDateKey(item.viewedAt),
    });
  }

  for (const log of workoutLogs) {
    if (!isFreeWeightMachineCode(log.machineCode) || !log.targetMuscleGroup) continue;

    const logDate = normalizeDateKey(log.logDate);
    const key = buildFreeWeightCardKey(log.machineCode, logDate, log.targetMuscleGroup);
    if (freeWeightKeys.has(key)) continue;
    freeWeightKeys.add(key);

    const history = findHistoryForFreeWeightCard(
      historyItems,
      log.machineCode,
      logDate,
      log.targetMuscleGroup,
      log.recommendationId
    );

    cards.push({
      cardId: key,
      historyId:
        history?.targetMuscleGroup === log.targetMuscleGroup ? history.id : undefined,
      machineCode: log.machineCode,
      machineName: log.machineName ?? history?.machineName ?? log.machineCode,
      muscleGroup: history?.muscleGroup,
      targetMuscleGroup: log.targetMuscleGroup,
      recommendationId: log.recommendationId ?? history?.recommendationId,
      settings: history?.settings ?? {},
      viewedAt: log.updatedAt || log.createdAt,
      logDate,
    });
  }

  for (const item of historyItems) {
    if (!isFreeWeightMachineCode(item.machineCode) || !item.targetMuscleGroup) continue;

    const logDate = normalizeDateKey(getLocalDateKey(item.viewedAt));
    const key = buildFreeWeightCardKey(item.machineCode, logDate, item.targetMuscleGroup);
    if (freeWeightKeys.has(key)) continue;
    freeWeightKeys.add(key);

    cards.push({
      cardId: `history-${item.id}`,
      historyId: item.id,
      machineCode: item.machineCode,
      machineName: item.machineName,
      muscleGroup: item.muscleGroup,
      targetMuscleGroup: item.targetMuscleGroup as TargetMuscleGroup,
      recommendationId: item.recommendationId,
      settings: item.settings,
      viewedAt: item.viewedAt,
      logDate,
    });
  }

  cards.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
  return cards;
}

export function historyRecordCardHasLog(
  card: HistoryRecordCard,
  loggedKeys: Set<string>
): boolean {
  return loggedKeys.has(
    buildLoggedWorkoutKey(
      card.machineCode,
      normalizeDateKey(card.logDate),
      card.targetMuscleGroup
    )
  );
}

export function filterHistoryRecordCardsByLogStatus(
  cards: HistoryRecordCard[],
  loggedKeys: Set<string>,
  status: HistoryLogStatus
): HistoryRecordCard[] {
  if (status === 'all') return cards;
  return cards.filter((card) => {
    const hasLog = historyRecordCardHasLog(card, loggedKeys);
    return status === 'saved' ? hasLog : !hasLog;
  });
}

export function groupRecordCardsByDate(
  cards: HistoryRecordCard[]
): { dateKey: string; items: HistoryRecordCard[] }[] {
  const groups: { dateKey: string; items: HistoryRecordCard[] }[] = [];
  const indexByDate = new Map<string, number>();

  for (const card of cards) {
    const dateKey = card.logDate;
    const existingIndex = indexByDate.get(dateKey);

    if (existingIndex === undefined) {
      indexByDate.set(dateKey, groups.length);
      groups.push({ dateKey, items: [card] });
      continue;
    }

    groups[existingIndex].items.push(card);
  }

  return groups;
}

export function extractRecordCardDateKeys(cards: HistoryRecordCard[]): Set<string> {
  return new Set(cards.map((card) => card.logDate));
}
