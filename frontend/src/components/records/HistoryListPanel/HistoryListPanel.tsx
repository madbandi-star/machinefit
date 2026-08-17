import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, ArrowUpDown } from 'lucide-react';
import { Icon } from '@/components/icons/Icon';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { HistoryLogStatusFilter } from '@/components/records/HistoryLogStatusFilter/HistoryLogStatusFilter';
import { PlanDatePickerDialog } from '@/components/records/PlanDatePickerDialog/PlanDatePickerDialog';
import { HistoryDayActionsSheet } from '@/components/records/HistoryDayActionsSheet/HistoryDayActionsSheet';
import { favoriteApi, historyApi, workoutCardApi, workoutLogApi } from '@/api';
import { fetchWorkoutLogs } from '@/api/workout-log';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import {
  collectMuscleGroupCountsInOrder,
  collectMuscleGroupsInOrder,
  formatHistoryDateHeader,
  formatHistoryDateHeaderWithMuscles,
  getTodayDateKey,
  getTomorrowDateKey,
  normalizeDateKey,
} from '@/utils/historyDate';
import {
  buildLoggedWorkoutKey,
  buildLoggedWorkoutKeys,
  parseHistoryLogStatus,
  type HistoryLogStatus,
} from '@/utils/historyLogStatus';
import {
  expandHistoryRecordCards,
  extractRecordCardDateKeys,
  filterHistoryRecordCardsByLogStatus,
  findHistoryCardByFocusId,
  groupRecordCardsByDate,
  historyCardMatchesFocus,
  type HistoryRecordCard as HistoryRecordCardData,
} from '@/utils/historyRecordsDisplay';
import { mergeWorkoutPlanCards } from '@/utils/workoutPlanCards';
import { HistoryDateCalendarDialog } from '@/components/records/HistoryDateCalendarDialog/HistoryDateCalendarDialog';
import { HistorySummaryStats } from '@/components/records/HistorySummaryStats/HistorySummaryStats';
import { HistoryRecordCard } from '@/components/records/HistoryRecordCard/HistoryRecordCard';
import { isDismissedToday } from '@/utils/dismissToday';
import { getHistoryMuscleGroup, formatFreeWeightRecordLabel, formatBrandedMachineLabel } from '@/utils/freeWeightDisplay';
import { isAllGymsId, isFreeWeightMachineCode } from '@machinefit/shared';
import type {
  WorkoutCard,
  WorkoutCardTemplateItem,
  WorkoutLog,
  WorkoutRecordDisplayOrder,
} from '@machinefit/shared';
import { useUIStore } from '@/store/ui.store';
import { useCardVoicePrefsStore } from '@/store/cardVoicePrefs.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { getApiErrorCode } from '@/utils/motivationAudio';
import { useHistorySettingsComparisonData } from '@/hooks/useHistorySettingsComparisonData';
import { computeHistorySummaryStats } from '@/utils/historySummaryStats';
import {
  mergeHistoryPreferences,
  useHistoryLiveAdjustedPrefs,
} from '@/utils/historyLiveAdjustedPrefs';
import { hapticTap } from '@/utils/haptic';
import {
  applyWorkoutCardOrderMove,
  buildWorkoutCardOrderKey,
  sortCardsByDisplayOrder,
  toReorderPayloadItems,
  type WorkoutCardOrderMove,
} from '@/utils/workoutCardOrder';
import { resolveVoicePrefsForTemplate } from '@/utils/workoutCardVoicePrefs';
import '@/styles/history-premium.css';
import '@/styles/recommendation.css';
import '@/styles/records.css';

const HISTORY_LIST_LIMIT = 100;
const HISTORY_WORKOUT_LOG_LIMIT = 200;
const HISTORY_DELETE_DISMISS_KEY = 'history-delete-confirm-dismiss';
/** Wide window so future plans + older history share one query. */
const PLAN_RANGE_FROM = '2020-01-01';
const PLAN_RANGE_TO = '2035-12-31';

interface PendingDelete {
  cardId: string;
  historyId?: string;
  machineCode: string;
  recommendationId?: string;
  logDate: string;
  targetMuscleGroup?: string;
  workoutCardId?: string;
  isPlanOnly?: boolean;
}

function normalizeTemplateWeights(setCount: number, weights: number[] | undefined): number[] {
  const count = Math.max(1, setCount || 1);
  const next = Array.isArray(weights) ? weights.slice(0, count).map((w) => (Number.isFinite(w) ? w : 0)) : [];
  while (next.length < count) next.push(next[next.length - 1] ?? 0);
  return next.length > 0 ? next : [0];
}

function templateMatchKey(machineCode: string, targetMuscleGroup?: string | null): string {
  return `${machineCode}:${targetMuscleGroup ?? ''}`;
}

/** Prefer workout_logs for performed sets/weights; keep plan card order/meta when present. */
function buildTemplateItemsFromDay(
  cards: WorkoutCard[],
  logs: WorkoutLog[],
  fromDate: string
): WorkoutCardTemplateItem[] {
  const logByKey = new Map<string, WorkoutLog>();
  for (const log of logs) {
    logByKey.set(templateMatchKey(log.machineCode, log.targetMuscleGroup), log);
  }

  const usedKeys = new Set<string>();
  const items: WorkoutCardTemplateItem[] = [];
  const liveByKey = useCardVoicePrefsStore.getState().byKey;
  const dateKey = normalizeDateKey(fromDate);

  cards.forEach((card, index) => {
    const key = templateMatchKey(card.machineCode, card.targetMuscleGroup);
    usedKeys.add(key);
    const log = logByKey.get(key);
    const setCount = Math.max(1, log?.setCount || card.setCount || 1);
    const setWeightsKg = normalizeTemplateWeights(
      setCount,
      log?.setWeightsKg?.length ? log.setWeightsKg : card.setWeightsKg
    );
    const diary = (log?.diary?.trim() || card.diary?.trim() || '') || undefined;
    const voicePrefs = resolveVoicePrefsForTemplate({
      machineCode: card.machineCode,
      logDate: dateKey,
      targetMuscleGroup: card.targetMuscleGroup,
      cardVoicePrefs: card.voicePrefs,
      liveByKey,
    });
    items.push({
      machineCode: card.machineCode,
      ...(card.targetMuscleGroup ? { targetMuscleGroup: card.targetMuscleGroup } : {}),
      setCount,
      setWeightsKg,
      ...(card.setReps?.length ? { setReps: card.setReps.slice(0, setCount) } : {}),
      ...(diary ? { diary } : {}),
      ...(card.restSeconds != null ? { restSeconds: card.restSeconds } : {}),
      displayOrder: card.displayOrder ?? index,
      ...(card.recommendationId || log?.recommendationId
        ? { recommendationId: card.recommendationId ?? log?.recommendationId }
        : {}),
      voicePrefs,
    });
  });

  logs.forEach((log) => {
    const key = templateMatchKey(log.machineCode, log.targetMuscleGroup);
    if (usedKeys.has(key)) return;
    usedKeys.add(key);
    const setCount = Math.max(1, log.setCount || 1);
    const voicePrefs = resolveVoicePrefsForTemplate({
      machineCode: log.machineCode,
      logDate: dateKey,
      targetMuscleGroup: log.targetMuscleGroup,
      liveByKey,
    });
    items.push({
      machineCode: log.machineCode,
      ...(log.targetMuscleGroup ? { targetMuscleGroup: log.targetMuscleGroup } : {}),
      setCount,
      setWeightsKg: normalizeTemplateWeights(setCount, log.setWeightsKg),
      ...(log.diary?.trim() ? { diary: log.diary.trim() } : {}),
      displayOrder: items.length,
      ...(log.recommendationId ? { recommendationId: log.recommendationId } : {}),
      voicePrefs,
    });
  });

  return items;
}

export function HistoryListPanel() {
  const { t, i18n } = useTranslation(['common', 'machines']);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [pendingDayDelete, setPendingDayDelete] = useState(false);
  const [pendingTemplateDelete, setPendingTemplateDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [pendingDateAction, setPendingDateAction] = useState<{
    mode: 'move' | 'copy';
    card: HistoryRecordCardData;
  } | null>(null);
  const [dayMenuOpen, setDayMenuOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateSortDir, setDateSortDir] = useState<'desc' | 'asc'>(() => {
    try {
      return localStorage.getItem('machinefit.historyDateSort') === 'asc' ? 'asc' : 'desc';
    } catch {
      return 'desc';
    }
  });
  const [orderOverrides, setOrderOverrides] = useState<Record<string, string[]>>({});
  const [animatingCardId, setAnimatingCardId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get('date') ?? '';
  const focusId = searchParams.get('focus') ?? '';
  const logStatus = parseHistoryLogStatus(searchParams.get('logStatus'));
  const memberKey = activeMemberId ?? '';
  const targetDeleteDate = selectedDate || getTodayDateKey();
  const usesSelectedDateLabel = Boolean(selectedDate);
  const canPersistOrder =
    isAuthenticated &&
    Boolean(activeGymId) &&
    Boolean(activeMemberId) &&
    !isAllGymsId(activeGymId ?? '') &&
    logStatus === 'all';

  const calendarQueryKey = QUERY_KEYS.historyList(activeGymId ?? '', memberKey, {
    limit: HISTORY_LIST_LIMIT,
  });

  const {
    data: allHistory,
    isLoading: isAllHistoryLoading,
    isError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: calendarQueryKey,
    queryFn: async () => {
      const res = await historyApi.list(activeGymId!, {
        limit: HISTORY_LIST_LIMIT,
        memberId: activeMemberId ?? undefined,
      });
      return res.data.data;
    },
    enabled: Boolean(activeGymId) && memberScopeReady && Boolean(activeMemberId),
    // Keep prior list visible while a post-delete refetch runs (or fails).
    placeholderData: (previous) => previous,
  });

  const { data: workoutLogs } = useQuery({
    queryKey: QUERY_KEYS.workoutLogsList(activeGymId ?? '', memberKey, {
      limit: HISTORY_WORKOUT_LOG_LIMIT,
    }),
    queryFn: ({ signal }) =>
      fetchWorkoutLogs({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        limit: HISTORY_WORKOUT_LOG_LIMIT,
        signal,
      }),
    enabled: isAuthenticated && Boolean(activeGymId) && memberScopeReady && Boolean(activeMemberId),
  });

  const { data: favoritesList } = useQuery({
    queryKey: QUERY_KEYS.favorites(activeGymId ?? '', memberKey),
    queryFn: async () => {
      const res = await favoriteApi.list(activeGymId!, activeMemberId ?? undefined);
      return res.data.data;
    },
    enabled:
      isAuthenticated && Boolean(activeGymId) && memberScopeReady && Boolean(activeMemberId),
    staleTime: 60_000,
  });

  const displayOrderQueryKey = QUERY_KEYS.workoutRecordDisplayOrder(
    activeGymId ?? '',
    memberKey
  );

  const { data: displayOrders } = useQuery({
    queryKey: displayOrderQueryKey,
    queryFn: async () => {
      const res = await workoutLogApi.listDisplayOrder({
        gymId: activeGymId!,
        memberId: activeMemberId!,
      });
      return res.data.data;
    },
    enabled: canPersistOrder && memberScopeReady,
    staleTime: 30_000,
  });

  const canUseWorkoutPlans =
    isAuthenticated &&
    Boolean(activeGymId) &&
    Boolean(activeMemberId) &&
    memberScopeReady &&
    !isAllGymsId(activeGymId ?? '');

  const workoutCardsQueryKey = QUERY_KEYS.workoutCardsList(activeGymId ?? '', memberKey, {
    from: PLAN_RANGE_FROM,
    to: PLAN_RANGE_TO,
  });

  const { data: workoutCards } = useQuery({
    queryKey: workoutCardsQueryKey,
    queryFn: async () => {
      const res = await workoutCardApi.list({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        from: PLAN_RANGE_FROM,
        to: PLAN_RANGE_TO,
        limit: 500,
      });
      return res.data.data ?? [];
    },
    enabled: canUseWorkoutPlans,
    staleTime: 30_000,
  });

  const { data: planTemplates = [] } = useQuery({
    queryKey: QUERY_KEYS.workoutCardTemplates(activeGymId ?? ''),
    queryFn: async () => {
      const res = await workoutCardApi.listTemplates({ gymId: activeGymId! });
      return res.data.data ?? [];
    },
    enabled: canUseWorkoutPlans,
    staleTime: 60_000,
  });

  const favoriteByMachine = useMemo(() => {
    const map = new Map<string, { id: string }>();
    for (const item of favoritesList ?? []) {
      map.set(item.machineCode, { id: item.id });
    }
    return map;
  }, [favoritesList]);

  const loggedKeys = useMemo(
    () => buildLoggedWorkoutKeys(workoutLogs ?? []),
    [workoutLogs]
  );

  const historyOnlyCards = useMemo(
    () => expandHistoryRecordCards(allHistory ?? [], workoutLogs ?? []),
    [allHistory, workoutLogs]
  );

  const allRecordCards = useMemo(
    () => mergeWorkoutPlanCards(historyOnlyCards, workoutCards ?? []),
    [historyOnlyCards, workoutCards]
  );

  const filteredAllCards = useMemo(
    () => filterHistoryRecordCardsByLogStatus(allRecordCards, loggedKeys, logStatus),
    [allRecordCards, loggedKeys, logStatus]
  );

  const displayCards = useMemo(
    () =>
      selectedDate
        ? filteredAllCards.filter((card) => card.logDate === selectedDate)
        : filteredAllCards,
    [filteredAllCards, selectedDate]
  );

  const datesWithData = useMemo(() => {
    const keys = extractRecordCardDateKeys(filteredAllCards);
    for (const card of workoutCards ?? []) {
      keys.add(normalizeDateKey(card.scheduledDate));
    }
    return keys;
  }, [filteredAllCards, workoutCards]);

  const dateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const card of filteredAllCards) {
      counts.set(card.logDate, (counts.get(card.logDate) ?? 0) + 1);
    }
    return counts;
  }, [filteredAllCards]);

  const dateMuscleCounts = useMemo(() => {
    const byDate = new Map<string, typeof filteredAllCards>();
    for (const card of filteredAllCards) {
      const list = byDate.get(card.logDate);
      if (list) list.push(card);
      else byDate.set(card.logDate, [card]);
    }
    const summaries = new Map<string, ReturnType<typeof collectMuscleGroupCountsInOrder>>();
    for (const [dateKey, cards] of byDate) {
      const rows = collectMuscleGroupCountsInOrder(cards);
      if (rows.length) summaries.set(dateKey, rows);
    }
    return summaries;
  }, [filteredAllCards]);

  const groupedCards = useMemo(() => {
    if (!displayCards.length) return [];
    const groups = groupRecordCardsByDate(displayCards);
    const orders = displayOrders ?? [];

    const mapped = groups.map((group) => {
      const overrideKeys = orderOverrides[group.dateKey];
      let items = sortCardsByDisplayOrder(group.items, orders);

      if (overrideKeys?.length) {
        const byKey = new Map(
          items.map((card) => [
            buildWorkoutCardOrderKey(card.machineCode, card.logDate, card.targetMuscleGroup),
            card,
          ])
        );
        const ordered: HistoryRecordCardData[] = [];
        for (const key of overrideKeys) {
          const card = byKey.get(key);
          if (card) {
            ordered.push(card);
            byKey.delete(key);
          }
        }
        for (const card of byKey.values()) ordered.push(card);
        items = ordered;
      }

      return { dateKey: group.dateKey, items };
    });

    return mapped.sort((a, b) =>
      dateSortDir === 'desc'
        ? b.dateKey.localeCompare(a.dateKey)
        : a.dateKey.localeCompare(b.dateKey)
    );
  }, [displayCards, displayOrders, orderOverrides, dateSortDir]);

  const showDateSort = groupedCards.length > 1;

  const toggleDateSort = () => {
    setDateSortDir((prev) => {
      const next = prev === 'desc' ? 'asc' : 'desc';
      try {
        localStorage.setItem('machinefit.historyDateSort', next);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const defaultExpandedDateKey = useMemo(() => {
    if (!groupedCards.length) return null;
    const today = getTodayDateKey();
    if (groupedCards.some((group) => group.dateKey === today)) return today;
    return groupedCards[0]!.dateKey;
  }, [groupedCards]);

  const groupedDateSignature = useMemo(
    () => groupedCards.map((group) => group.dateKey).join('|'),
    [groupedCards]
  );

  const [expandedDates, setExpandedDates] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!defaultExpandedDateKey) {
      setExpandedDates(new Set());
      return;
    }
    setExpandedDates(new Set([defaultExpandedDateKey]));
  }, [defaultExpandedDateKey, groupedDateSignature, selectedDate, logStatus]);

  useEffect(() => {
    if (!focusId || displayCards.length === 0) return;
    const focusedCard = findHistoryCardByFocusId(displayCards, focusId);
    if (!focusedCard) return;
    setExpandedDates((prev) => {
      if (prev.has(focusedCard.logDate)) return prev;
      const next = new Set(prev);
      next.add(focusedCard.logDate);
      return next;
    });
  }, [focusId, displayCards]);

  const toggleDateGroup = (dateKey: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  const { data: comparisonData } = useHistorySettingsComparisonData(
    allRecordCards,
    isAuthenticated
  );
  const liveAdjustedPrefs = useHistoryLiveAdjustedPrefs();

  const summaryStats = useMemo(
    () =>
      computeHistorySummaryStats(displayCards, workoutLogs ?? [], {
        preferencesByMachine: mergeHistoryPreferences(
          comparisonData?.preferencesByMachine,
          liveAdjustedPrefs
        ),
        feedbackByRecommendation: comparisonData?.feedbackByRecommendation,
      }),
    [
      displayCards,
      workoutLogs,
      comparisonData?.preferencesByMachine,
      comparisonData?.feedbackByRecommendation,
      liveAdjustedPrefs,
    ]
  );

  const translateMuscleGroup = (group: string) =>
    t(`machines:muscleGroups.${group}`, { defaultValue: group });

  const isLoading =
    (!activeGymId || !memberScopeReady || isAllHistoryLoading) && !allHistory;

  useEffect(() => {
    if (!focusId || isLoading || displayCards.length === 0) return;

    const focusedCard = findHistoryCardByFocusId(displayCards, focusId);
    const elementId = focusedCard ? focusedCard.cardId : focusId;
    const element = document.getElementById(`history-item-${elementId}`);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('history-record-card--focused');
    }

    const timer = window.setTimeout(() => {
      element?.classList.remove('history-record-card--focused');
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('focus');
          return next;
        },
        { replace: true }
      );
    }, element ? 3000 : 0);

    return () => window.clearTimeout(timer);
  }, [focusId, isLoading, displayCards, setSearchParams]);

  const updateSearchParams = (mutate: (next: URLSearchParams) => void) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        mutate(next);
        if (!next.get('tab')) {
          next.set('tab', 'history');
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleDateChange = (value: string) => {
    updateSearchParams((next) => {
      if (value) {
        next.set('date', value);
      } else {
        next.delete('date');
      }
    });
  };

  const handleLogStatusChange = (value: HistoryLogStatus) => {
    updateSearchParams((next) => {
      if (value === 'all') {
        next.delete('logStatus');
      } else {
        next.set('logStatus', value);
      }
    });
  };

  const invalidateAfterWorkoutDelete = useCallback(async () => {
    // Soft refresh: do not block UI on home-bootstrap (it can race gym/member scope
    // and leave the history query stuck in isError after delete).
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutCards }),
      queryClient.invalidateQueries({ queryKey: displayOrderQueryKey }),
    ]);
    void queryClient.invalidateQueries({ queryKey: ['user', 'home-bootstrap'] });
  }, [displayOrderQueryKey, queryClient]);

  const invalidatePlans = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutCards }),
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workoutCardTemplates(activeGymId ?? ''),
      }),
    ]);
  }, [activeGymId, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async ({
      historyId,
      machineCode,
      logDate,
      targetMuscleGroup,
      workoutCardId,
      isPlanOnly,
    }: PendingDelete) => {
      if (workoutCardId && (isPlanOnly || !historyId)) {
        await workoutCardApi.remove(workoutCardId);
        if (isPlanOnly) return;
      }
      if (historyId) {
        await historyApi.remove(historyId);
      }
      if (!activeGymId || !activeMemberId) return;
      try {
        await workoutLogApi.remove({
          gymId: activeGymId,
          memberId: activeMemberId,
          machineCode,
          logDate,
          ...(targetMuscleGroup ? { targetMuscleGroup } : {}),
        });
      } catch {
        /* workout log may not exist */
      }
      if (workoutCardId && historyId) {
        try {
          await workoutCardApi.remove(workoutCardId);
        } catch {
          /* plan may already be gone */
        }
      }
    },
    onSuccess: async (_data, deleted) => {
      setPendingDelete(null);
      // Optimistic cache update so Records never flashes a full-page load error
      // if the follow-up invalidate/refetch is slow or briefly fails.
      if (deleted.historyId) {
        queryClient.setQueryData(calendarQueryKey, (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.filter((item: { id?: string }) => item.id !== deleted.historyId);
        });
      }
      if (deleted.workoutCardId) {
        queryClient.setQueryData(workoutCardsQueryKey, (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.filter((item: { id?: string }) => item.id !== deleted.workoutCardId);
        });
      }
      await invalidateAfterWorkoutDelete();
      showToast(t('machines:history.removed'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const movePlanMutation = useMutation({
    mutationFn: async ({ id, scheduledDate }: { id: string; scheduledDate: string }) => {
      const res = await workoutCardApi.moveDate(id, { scheduledDate });
      return res.data.data;
    },
    onSuccess: async () => {
      await Promise.all([
        invalidatePlans(),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history }),
        queryClient.invalidateQueries({ queryKey: displayOrderQueryKey }),
      ]);
      showToast(t('machines:history.planMoved'), 'success');
    },
    onError: (error) => {
      if (getApiErrorCode(error) === 'DUPLICATE_CARD') {
        showToast(t('machines:history.planDuplicateMachine'), 'info');
        return;
      }
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  const copyPlanMutation = useMutation({
    mutationFn: async ({ id, scheduledDate }: { id: string; scheduledDate: string }) => {
      const res = await workoutCardApi.copy(id, { scheduledDate, status: 'PLANNED' });
      return res.data.data;
    },
    onSuccess: async () => {
      await Promise.all([
        invalidatePlans(),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history }),
      ]);
      showToast(t('machines:history.planCopied'), 'success');
    },
    onError: (error) => {
      if (getApiErrorCode(error) === 'DUPLICATE_CARD') {
        showToast(t('machines:history.planDuplicateMachine'), 'info');
        return;
      }
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async ({ name, fromDate }: { name: string; fromDate: string }) => {
      if (!activeGymId) throw new Error('missing_gym');
      const dateKey = normalizeDateKey(fromDate);
      const dayPlans = (workoutCards ?? []).filter(
        (card) => normalizeDateKey(card.scheduledDate) === dateKey
      );
      const dayLogs = (workoutLogs ?? []).filter(
        (log) => normalizeDateKey(log.logDate) === dateKey
      );

      // Merge plans + logs; performed sets/weights prefer workout_logs.
      // Voice prefs: live card pickers + settings snapshot (or persisted card.voicePrefs).
      const items = buildTemplateItemsFromDay(dayPlans, dayLogs, dateKey);

      if (items.length === 0) {
        const err = new Error('EMPTY_TEMPLATE');
        (err as Error & { code?: string }).code = 'EMPTY_TEMPLATE';
        throw err;
      }

      const res = await workoutCardApi.createTemplate({
        gymId: activeGymId,
        name,
        items,
        fromDate: dateKey,
      });
      return res.data.data;
    },
    onSuccess: async () => {
      await invalidatePlans();
      showToast(t('machines:history.planTemplateSaved'), 'success');
    },
    onError: (error) => {
      const localCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: string }).code ?? '')
          : '';
      const axiosCode =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { error?: { code?: string } } } }).response?.data
          ?.error?.code;
      if (localCode === 'EMPTY_TEMPLATE' || axiosCode === 'EMPTY_TEMPLATE') {
        showToast(t('machines:history.planTemplateEmpty'), 'error');
        return;
      }
      showToast(getApiErrorMessage(error, t('common:errors.submitFailed')), 'error');
    },
  });

  const applyTemplateMutation = useMutation({
    mutationFn: async ({
      templateId,
      scheduledDate,
    }: {
      templateId: string;
      scheduledDate: string;
    }) => {
      const res = await workoutCardApi.applyTemplate({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        templateId,
        scheduledDate,
      });
      return res.data.data;
    },
    onSuccess: async () => {
      setDayMenuOpen(false);
      await Promise.all([
        invalidatePlans(),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history }),
      ]);
      showToast(t('machines:history.planTemplateApplied'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await workoutCardApi.deleteTemplate(templateId);
      return templateId;
    },
    onSuccess: async () => {
      setPendingTemplateDelete(null);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.workoutCardTemplates(activeGymId ?? ''),
      });
      showToast(t('machines:history.planTemplateDeleted'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const deleteDayMutation = useMutation({
    mutationFn: async (logDate: string) => {
      if (!activeGymId || !activeMemberId) {
        throw new Error('Missing gym or member scope');
      }
      await workoutLogApi.removeByDate(logDate, {
        gymId: activeGymId,
        memberId: activeMemberId,
      });
      const dayCards = (workoutCards ?? []).filter(
        (card) => normalizeDateKey(card.scheduledDate) === logDate
      );
      await Promise.allSettled(dayCards.map((card) => workoutCardApi.remove(card.id)));
    },
    onSuccess: async () => {
      setPendingDayDelete(false);
      setDayMenuOpen(false);
      await invalidateAfterWorkoutDelete();
      showToast(t('machines:history.deleteDayRemoved'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const reorderMutation = useMutation({
    mutationFn: async (payload: {
      logDate: string;
      items: ReturnType<typeof toReorderPayloadItems>;
      previousOverride?: string[];
    }) => {
      if (!activeGymId || !activeMemberId) {
        throw new Error('Missing gym or member scope');
      }
      await workoutLogApi.reorderDisplayOrder({
        gymId: activeGymId,
        memberId: activeMemberId,
        logDate: payload.logDate,
        items: payload.items,
      });
      return payload;
    },
    onSuccess: async (payload) => {
      const nextOrders: WorkoutRecordDisplayOrder[] = payload.items.map((item) => ({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        logDate: payload.logDate,
        machineCode: item.machineCode,
        targetMuscleGroup: item.targetMuscleGroup as WorkoutRecordDisplayOrder['targetMuscleGroup'],
        displayOrder: item.displayOrder,
      }));
      queryClient.setQueryData<WorkoutRecordDisplayOrder[]>(displayOrderQueryKey, (prev) => {
        const others = (prev ?? []).filter((row) => row.logDate !== payload.logDate);
        return [...others, ...nextOrders];
      });
      setOrderOverrides((prev) => {
        const next = { ...prev };
        delete next[payload.logDate];
        return next;
      });
      showToast(t('machines:history.orderChanged'), 'success');
    },
    onError: (_error, payload) => {
      setOrderOverrides((prev) => {
        const next = { ...prev };
        if (payload.previousOverride) {
          next[payload.logDate] = payload.previousOverride;
        } else {
          delete next[payload.logDate];
        }
        return next;
      });
      showToast(t('machines:history.orderChangeFailed'), 'error');
    },
  });

  const orderedCardsForDate = useCallback(
    (logDate: string): HistoryRecordCardData[] => {
      const dayCards = allRecordCards.filter((card) => card.logDate === logDate);
      let items = sortCardsByDisplayOrder(dayCards, displayOrders ?? []);
      const overrideKeys = orderOverrides[logDate];
      if (!overrideKeys?.length) return items;

      const byKey = new Map(
        items.map((card) => [
          buildWorkoutCardOrderKey(card.machineCode, card.logDate, card.targetMuscleGroup),
          card,
        ])
      );
      const ordered: HistoryRecordCardData[] = [];
      for (const key of overrideKeys) {
        const card = byKey.get(key);
        if (card) {
          ordered.push(card);
          byKey.delete(key);
        }
      }
      for (const card of byKey.values()) ordered.push(card);
      return ordered;
    },
    [allRecordCards, displayOrders, orderOverrides]
  );

  const handleOrderMove = useCallback(
    (logDate: string, card: HistoryRecordCardData, move: WorkoutCardOrderMove) => {
      if (!canPersistOrder) return;

      const dayItems = orderedCardsForDate(logDate);
      const index = dayItems.findIndex(
        (item) =>
          buildWorkoutCardOrderKey(item.machineCode, item.logDate, item.targetMuscleGroup) ===
          buildWorkoutCardOrderKey(card.machineCode, card.logDate, card.targetMuscleGroup)
      );
      if (index < 0) return;

      const previousOverride = orderOverrides[logDate];
      const nextItems = applyWorkoutCardOrderMove(dayItems, index, move);
      if (nextItems === dayItems) return;

      setAnimatingCardId(card.cardId);
      window.setTimeout(() => setAnimatingCardId(null), 420);

      const overrideKeys = nextItems.map((item) =>
        buildWorkoutCardOrderKey(item.machineCode, item.logDate, item.targetMuscleGroup)
      );
      setOrderOverrides((prev) => ({ ...prev, [logDate]: overrideKeys }));
      hapticTap();

      // Send full day order; repository updates only rows whose display_order changed.
      reorderMutation.mutate({
        logDate,
        items: toReorderPayloadItems(nextItems),
        previousOverride,
      });
    },
    [canPersistOrder, orderedCardsForDate, orderOverrides, reorderMutation]
  );

  const requestDelete = useCallback(
    (card: HistoryRecordCardData) => {
      const payload: PendingDelete = {
        cardId: card.cardId,
        historyId: card.historyId,
        machineCode: card.machineCode,
        recommendationId: card.recommendationId,
        logDate: card.logDate,
        targetMuscleGroup: card.targetMuscleGroup,
        workoutCardId: card.workoutCardId,
        isPlanOnly: card.isPlanOnly,
      };

      if (isDismissedToday(HISTORY_DELETE_DISMISS_KEY)) {
        deleteMutation.mutate(payload);
        return;
      }
      setPendingDelete(payload);
    },
    [deleteMutation]
  );

  const ensureWorkoutCardId = useCallback(
    async (card: HistoryRecordCardData): Promise<string> => {
      if (card.workoutCardId) return card.workoutCardId;
      if (!activeGymId || !activeMemberId) {
        throw new Error('missing_gym_or_member');
      }

      const dateKey = normalizeDateKey(card.logDate);
      const muscleKey = card.targetMuscleGroup ?? '';
      const existingPlan = (workoutCards ?? []).find(
        (plan) =>
          plan.machineCode === card.machineCode &&
          normalizeDateKey(plan.scheduledDate) === dateKey &&
          (plan.targetMuscleGroup ?? '') === muscleKey
      );
      if (existingPlan) return existingPlan.id;

      const log = (workoutLogs ?? []).find(
        (item) =>
          item.machineCode === card.machineCode &&
          normalizeDateKey(item.logDate) === dateKey &&
          (item.targetMuscleGroup ?? '') === muscleKey
      );

      const today = getTodayDateKey();
      const status = dateKey > today ? 'PLANNED' : 'COMPLETED';
      const setCount = Math.max(1, log?.setCount ?? 1);
      const seedWeight = card.settings.recommendedWeightKg ?? 0;
      const setWeightsKg =
        log?.setWeightsKg?.length === setCount
          ? log.setWeightsKg
          : Array.from({ length: setCount }, () => seedWeight);
      const setCompleted =
        log?.setCompleted?.length === setCount
          ? log.setCompleted
          : status === 'COMPLETED'
            ? Array.from({ length: setCount }, () => true)
            : Array.from({ length: setCount }, () => false);

      try {
        const voicePrefs = resolveVoicePrefsForTemplate({
          machineCode: card.machineCode,
          logDate: dateKey,
          targetMuscleGroup: card.targetMuscleGroup,
          cardVoicePrefs: card.planVoicePrefs,
          liveByKey: useCardVoicePrefsStore.getState().byKey,
        });
        const res = await workoutCardApi.create({
          gymId: activeGymId,
          memberId: activeMemberId,
          machineCode: card.machineCode,
          scheduledDate: dateKey,
          status,
          setCount,
          setWeightsKg,
          setCompleted,
          ...(log?.diary?.trim() ? { diary: log.diary.trim() } : {}),
          ...(card.recommendationId ? { recommendationId: card.recommendationId } : {}),
          ...(card.targetMuscleGroup ? { targetMuscleGroup: card.targetMuscleGroup } : {}),
          voicePrefs,
        });
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutCards });
        return res.data.data.id;
      } catch (error) {
        // Card may already exist (race / prior sync) — resolve by listing that date.
        const listed = await workoutCardApi.list({
          gymId: activeGymId,
          memberId: activeMemberId,
          scheduledDate: dateKey,
          limit: 100,
        });
        const found = (listed.data.data ?? []).find(
          (plan) =>
            plan.machineCode === card.machineCode &&
            (plan.targetMuscleGroup ?? '') === muscleKey
        );
        if (found) {
          await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutCards });
          return found.id;
        }
        throw error;
      }
    },
    [activeGymId, activeMemberId, queryClient, workoutCards, workoutLogs]
  );

  const openMoveOrCopyPicker = useCallback(
    (card: HistoryRecordCardData, mode: 'move' | 'copy') => {
      if (!canUseWorkoutPlans) return;
      setPendingDateAction({ mode, card });
    },
    [canUseWorkoutPlans]
  );

  const confirmMoveOrCopyDate = useCallback(
    async (nextDate: string) => {
      if (!pendingDateAction) return;
      const { card, mode } = pendingDateAction;
      setPendingDateAction(null);
      try {
        const id = await ensureWorkoutCardId(card);
        if (mode === 'move') {
          movePlanMutation.mutate({ id, scheduledDate: nextDate });
        } else {
          copyPlanMutation.mutate({ id, scheduledDate: nextDate });
        }
      } catch {
        showToast(t('common:errors.submitFailed'), 'error');
      }
    },
    [
      copyPlanMutation,
      ensureWorkoutCardId,
      movePlanMutation,
      pendingDateAction,
      showToast,
      t,
    ]
  );

  const confirmDelete = () => {
    if (pendingDelete) {
      deleteMutation.mutate(pendingDelete);
    }
  };

  // Must stay above early returns — Rules of Hooks (loading → loaded used to add this memo).
  const hasCardsOnTargetDate = useMemo(
    () => allRecordCards.some((card) => card.logDate === targetDeleteDate),
    [allRecordCards, targetDeleteDate]
  );

  const canSaveTemplateForDate = useMemo(() => {
    const dateKey = normalizeDateKey(targetDeleteDate);
    const hasPlans = (workoutCards ?? []).some(
      (card) => normalizeDateKey(card.scheduledDate) === dateKey
    );
    if (hasPlans) return true;
    return (workoutLogs ?? []).some((log) => normalizeDateKey(log.logDate) === dateKey);
  }, [targetDeleteDate, workoutCards, workoutLogs]);

  const todayDateKey = getTodayDateKey();
  /** Plan-for-date CTA only when calendar date ≠ today (today uses normal machine browse). */
  const showPlanAddForDate =
    Boolean(selectedDate) && normalizeDateKey(selectedDate) !== todayDateKey;
  const planAddUrl = `${ROUTES.MACHINES}?planDate=${encodeURIComponent(targetDeleteDate)}`;

  if (isLoading) return <Skeleton count={2} height={120} />;
  // Only block the page when we have nothing to show. A post-delete refetch
  // failure must not replace the whole Records UI with loadFailed.
  if (isError && !allHistory) {
    return (
      <QueryErrorMessage
        onRetry={() => {
          void refetchHistory();
        }}
      />
    );
  }

  const hasAnyRecords = allRecordCards.length > 0;
  const isEmptyList = !hasAnyRecords || displayCards.length === 0;
  const isEmptyOnDate =
    Boolean(selectedDate) &&
    (logStatus === 'all' || !hasAnyRecords) &&
    isEmptyList;
  const showLoadTemplateOnEmpty = canUseWorkoutPlans && isEmptyOnDate;

  const emptyFilterTitle = !hasAnyRecords
    ? selectedDate
      ? t('machines:history.emptyOnDate')
      : t('machines:history.empty')
    : logStatus === 'saved'
      ? t('machines:history.emptySaved')
      : logStatus === 'unsaved'
        ? t('machines:history.emptyUnsaved')
        : selectedDate
          ? t('machines:history.emptyOnDate')
          : t('machines:history.empty');

  const emptyActions = (
    <div className="records-list__empty-actions">
      {showLoadTemplateOnEmpty ? (
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setDayMenuOpen(true)}
        >
          {t('machines:history.planTemplateLoadAction')}
        </button>
      ) : null}
      {showPlanAddForDate ? (
        <Link
          to={planAddUrl}
          className={showLoadTemplateOnEmpty ? 'btn btn--secondary' : 'btn btn--primary'}
        >
          {t('machines:history.planAddForDate')}
        </Link>
      ) : null}
      {!hasAnyRecords ? (
        <Link
          to={ROUTES.MACHINES}
          className={
            showLoadTemplateOnEmpty || showPlanAddForDate
              ? 'btn btn--secondary'
              : 'btn btn--primary'
          }
        >
          {t('common:emptyState.browseMachines')}
        </Link>
      ) : selectedDate || logStatus !== 'all' ? (
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            updateSearchParams((next) => {
              next.delete('date');
              next.delete('logStatus');
            });
          }}
        >
          {t('machines:filterAll')}
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="records-list records-list--history history-page-premium">
      <div className="records-list__toolbar">
        {hasAnyRecords ? (
          <HistoryLogStatusFilter value={logStatus} onChange={handleLogStatusChange} />
        ) : null}

        <div className="records-list__toolbar-end">
          <div className="records-list__date-filter-block">
            <div className="records-list__filters">
              <button
                type="button"
                className={`records-list__calendar-trigger${calendarOpen ? ' is-open' : ''}${
                  selectedDate ? ' is-active' : ''
                }`}
                aria-haspopup={selectedDate ? undefined : 'dialog'}
                aria-expanded={selectedDate ? undefined : calendarOpen}
                aria-label={
                  selectedDate
                    ? t('machines:history.clearDateFilter')
                    : t('machines:history.filterByDate')
                }
                title={
                  selectedDate
                    ? t('machines:history.clearDateFilter')
                    : t('machines:history.filterByDate')
                }
                onClick={() => {
                  if (selectedDate) {
                    setCalendarOpen(false);
                    handleDateChange('');
                    return;
                  }
                  setCalendarOpen(true);
                }}
              >
                <Icon name="calendar" size={20} className="records-list__calendar-icon" />
              </button>
            </div>
          </div>

          {isAuthenticated && canUseWorkoutPlans ? (
            <button
              type="button"
              className="records-list__day-menu-trigger"
              aria-label={t('machines:history.menuAria')}
              aria-haspopup="dialog"
              aria-expanded={dayMenuOpen}
              onClick={() => setDayMenuOpen(true)}
            >
              <Icon name="settings" size={18} />
            </button>
          ) : null}

          {showDateSort ? (
            <button
              type="button"
              className={`records-list__date-sort-trigger${
                dateSortDir === 'asc' ? ' is-asc' : ' is-desc'
              }`}
              aria-label={
                dateSortDir === 'desc'
                  ? t('machines:history.dateSortNewestFirst')
                  : t('machines:history.dateSortOldestFirst')
              }
              title={
                dateSortDir === 'desc'
                  ? t('machines:history.dateSortNewestFirst')
                  : t('machines:history.dateSortOldestFirst')
              }
              onClick={toggleDateSort}
            >
              {dateSortDir === 'desc' ? (
                <ArrowDownUp size={18} strokeWidth={2.25} aria-hidden />
              ) : (
                <ArrowUpDown size={18} strokeWidth={2.25} aria-hidden />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {isEmptyList ? (
        <EmptyState
          icon="history"
          title={emptyFilterTitle}
          action={emptyActions}
        />
      ) : (
        <>
          {displayCards.length > 0 ? <HistorySummaryStats stats={summaryStats} /> : null}

          {groupedCards.map((group) => {
            const isExpanded = expandedDates.has(group.dateKey);
            const groupDateKey = normalizeDateKey(group.dateKey);
            const isTodayGroup = groupDateKey === todayDateKey;
            const isFutureGroup = groupDateKey > todayDateKey;
            const showDayAddExercise =
              isAuthenticated &&
              (isTodayGroup || (isFutureGroup && canUseWorkoutPlans));
            // Include planDate for today too so search shows 「추가됨」 on already-added machines.
            const dayAddExerciseUrl =
              isTodayGroup || isFutureGroup
                ? `${ROUTES.MACHINES}?planDate=${encodeURIComponent(groupDateKey)}`
                : ROUTES.MACHINES;
            return (
            <section
              key={group.dateKey}
              className={`records-list__date-group${
                isExpanded ? ' records-list__date-group--expanded' : ' records-list__date-group--collapsed'
              }`}
            >
              <h2 className="records-list__date-heading">
                <button
                  type="button"
                  className="records-list__date-toggle"
                  aria-expanded={isExpanded}
                  onClick={() => toggleDateGroup(group.dateKey)}
                >
                  <span className="records-list__date-toggle-main">
                    <Icon name="calendar" size={16} className="records-list__date-icon" />
                    <span className="records-list__date-toggle-label">
                      {formatHistoryDateHeaderWithMuscles(
                        group.dateKey,
                        i18n.language,
                        collectMuscleGroupsInOrder(group.items),
                        translateMuscleGroup
                      )}
                    </span>
                  </span>
                  <Icon
                    name="chevronDown"
                    size={18}
                    className={`records-list__date-chevron${
                      isExpanded ? ' records-list__date-chevron--open' : ''
                    }`}
                  />
                </button>
              </h2>

              {isExpanded
                ? group.items.map((card) => {
                // Same destinations as today cards: result when a recommendation exists,
                // otherwise machine detail with logDate (full log / recommend chrome).
                const resultUrl = card.recommendationId
                  ? `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', card.machineCode)}?id=${card.recommendationId}&logDate=${encodeURIComponent(card.logDate)}`
                  : `${ROUTES.MACHINE_DETAIL.replace(':machineCode', card.machineCode)}?logDate=${encodeURIComponent(card.logDate)}${
                      card.targetMuscleGroup
                        ? `&muscle=${encodeURIComponent(card.targetMuscleGroup)}`
                        : ''
                    }`;
                const displayName = isFreeWeightMachineCode(card.machineCode)
                  ? formatFreeWeightRecordLabel(
                      card.machineName,
                      card.targetMuscleGroup,
                      translateMuscleGroup
                    )
                  : formatBrandedMachineLabel(
                      card.machineName,
                      card.brandName,
                      card.machineCode
                    );
                const muscleGroup = getHistoryMuscleGroup(
                  card.machineCode,
                  card.muscleGroup,
                  card.targetMuscleGroup
                );
                const customSettings = comparisonData?.preferencesByMachine[card.machineCode];
                const activeSource = comparisonData?.activeSourceByMachine[card.machineCode];
                const fitRating = card.recommendationId
                  ? comparisonData?.feedbackByRecommendation[card.recommendationId]
                  : null;
                const favorite = favoriteByMachine.get(card.machineCode);
                const workoutLogSaved = loggedKeys.has(
                  buildLoggedWorkoutKey(
                    card.machineCode,
                    normalizeDateKey(card.logDate),
                    card.targetMuscleGroup
                  )
                );

                const dayOrdered = orderedCardsForDate(group.dateKey);
                const orderIndex = dayOrdered.findIndex(
                  (item) =>
                    buildWorkoutCardOrderKey(
                      item.machineCode,
                      item.logDate,
                      item.targetMuscleGroup
                    ) ===
                    buildWorkoutCardOrderKey(
                      card.machineCode,
                      card.logDate,
                      card.targetMuscleGroup
                    )
                );

                return (
                  <HistoryRecordCard
                    key={buildWorkoutCardOrderKey(
                      card.machineCode,
                      card.logDate,
                      card.targetMuscleGroup
                    )}
                    card={card}
                    resultUrl={resultUrl}
                    displayName={displayName}
                    muscleGroup={muscleGroup}
                    initialFitRating={fitRating}
                    initialCustomSettings={customSettings}
                    initialActiveSource={activeSource}
                    initialFavorited={favoritesList ? Boolean(favorite) : null}
                    initialFavoriteId={favorite?.id}
                    initialWorkoutLogSaved={workoutLogs ? workoutLogSaved : null}
                    isAuthenticated={isAuthenticated}
                    lockTargetMuscle={Boolean(
                      card.targetMuscleGroup && isFreeWeightMachineCode(card.machineCode)
                    )}
                    isFocused={historyCardMatchesFocus(card, focusId)}
                    onDelete={() => requestDelete(card)}
                    deleteDisabled={deleteMutation.isPending}
                    orderIndex={orderIndex}
                    orderTotal={dayOrdered.length}
                    orderDisabled={!canPersistOrder || reorderMutation.isPending}
                    onOrderMove={
                      canPersistOrder
                        ? (move) => handleOrderMove(group.dateKey, card, move)
                        : undefined
                    }
                    isReordering={animatingCardId === card.cardId}
                    onCopyPlan={
                      canUseWorkoutPlans
                        ? () => openMoveOrCopyPicker(card, 'copy')
                        : undefined
                    }
                    onMovePlan={
                      canUseWorkoutPlans
                        ? () => openMoveOrCopyPicker(card, 'move')
                        : undefined
                    }
                    planActionsDisabled={
                      movePlanMutation.isPending || copyPlanMutation.isPending
                    }
                  />
                );
              })
                : null}

              {showDayAddExercise && isExpanded ? (
                <div className="records-list__day-add">
                  <Link
                    to={dayAddExerciseUrl}
                    className="btn btn--secondary records-list__day-add-btn"
                  >
                    {t('machines:history.planAddExercise')}
                  </Link>
                </div>
              ) : null}
            </section>
            );
          })}
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('machines:history.deleteTitle')}
        message={t('machines:history.deleteMessage')}
        confirmLabel={t('machines:history.deleteConfirm')}
        confirmVariant="danger"
        dismissTodayKey={HISTORY_DELETE_DISMISS_KEY}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={pendingDayDelete}
        title={t('machines:history.deleteDayTitle')}
        message={t('machines:history.deleteDayMessage')}
        confirmLabel={t('machines:history.deleteDayConfirm')}
        confirmVariant="danger"
        onClose={() => setPendingDayDelete(false)}
        onConfirm={() => deleteDayMutation.mutate(targetDeleteDate)}
      />

      <ConfirmDialog
        open={Boolean(pendingTemplateDelete)}
        title={t('machines:history.planTemplateDeleteTitle')}
        message={t('machines:history.planTemplateDeleteMessage', {
          name: pendingTemplateDelete?.name ?? '',
        })}
        confirmLabel={t('machines:history.planTemplateDeleteConfirm')}
        confirmVariant="danger"
        onClose={() => setPendingTemplateDelete(null)}
        onConfirm={() => {
          if (!pendingTemplateDelete) return;
          deleteTemplateMutation.mutate(pendingTemplateDelete.id);
        }}
      />

      <HistoryDateCalendarDialog
        open={calendarOpen}
        datesWithData={datesWithData}
        dateCounts={dateCounts}
        dateMuscleCounts={dateMuscleCounts}
        selectedDate={selectedDate}
        locale={i18n.language}
        allowEmptySelect
        onSelect={handleDateChange}
        onClose={() => setCalendarOpen(false)}
      />

      <HistoryDayActionsSheet
        open={dayMenuOpen}
        dateLabel={formatHistoryDateHeader(targetDeleteDate, i18n.language)}
        showPlanAdd={showPlanAddForDate}
        planAddUrl={planAddUrl}
        canSaveTemplate={canUseWorkoutPlans && canSaveTemplateForDate}
        templates={canUseWorkoutPlans ? planTemplates : []}
        canDeleteDay={hasCardsOnTargetDate}
        deleteLabel={
          usesSelectedDateLabel
            ? t('machines:history.deleteDayMenuSelected')
            : t('machines:history.deleteDayMenuToday')
        }
        savingTemplate={saveTemplateMutation.isPending}
        applyingTemplate={applyTemplateMutation.isPending}
        deletingTemplate={deleteTemplateMutation.isPending}
        onClose={() => setDayMenuOpen(false)}
        onSaveTemplate={(name) => {
          setDayMenuOpen(false);
          saveTemplateMutation.mutate({ name, fromDate: targetDeleteDate });
        }}
        onApplyTemplate={(templateId) => {
          setDayMenuOpen(false);
          applyTemplateMutation.mutate({
            templateId,
            scheduledDate: targetDeleteDate,
          });
        }}
        onDeleteTemplate={(templateId) => {
          const template = planTemplates.find((item) => item.id === templateId);
          if (!template) return;
          setDayMenuOpen(false);
          setPendingTemplateDelete({ id: template.id, name: template.name });
        }}
        onDeleteDay={() => {
          setDayMenuOpen(false);
          setPendingDayDelete(true);
        }}
      />

      <PlanDatePickerDialog
        open={Boolean(pendingDateAction)}
        title={
          pendingDateAction?.mode === 'copy'
            ? t('machines:history.planDateCopyTitle')
            : t('machines:history.planDateMoveTitle')
        }
        message={t('machines:history.planDatePrompt')}
        initialDate={getTomorrowDateKey()}
        confirmLabel={
          pendingDateAction?.mode === 'copy'
            ? t('machines:history.planDateCopyConfirm')
            : t('machines:history.planDateMoveConfirm')
        }
        onClose={() => setPendingDateAction(null)}
        onConfirm={(dateKey) => void confirmMoveOrCopyDate(dateKey)}
      />
    </div>
  );
}
