import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { HistoryLogStatusFilter } from '@/components/records/HistoryLogStatusFilter/HistoryLogStatusFilter';
import { historyApi } from '@/api';
import { fetchWorkoutLogs } from '@/api/workout-log';
import { workoutLogApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import {
  collectMuscleGroupsInOrder,
  formatHistoryDateHeaderWithMuscles,
  getTodayDateKey,
} from '@/utils/historyDate';
import {
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
import { HistoryDateCalendar } from '@/components/records/HistoryDateCalendar/HistoryDateCalendar';
import { HistorySummaryStats } from '@/components/records/HistorySummaryStats/HistorySummaryStats';
import { HistoryRecordCard } from '@/components/records/HistoryRecordCard/HistoryRecordCard';
import { isDismissedToday } from '@/utils/dismissToday';
import { getHistoryMuscleGroup, formatFreeWeightRecordLabel, formatBrandedMachineLabel } from '@/utils/freeWeightDisplay';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { useUIStore } from '@/store/ui.store';
import { useHistorySettingsComparisonData } from '@/hooks/useHistorySettingsComparisonData';
import { computeHistorySummaryStats } from '@/utils/historySummaryStats';
import {
  mergeHistoryPreferences,
  useHistoryLiveAdjustedPrefs,
} from '@/utils/historyLiveAdjustedPrefs';
import '@/styles/history-premium.css';
import '@/styles/recommendation.css';
import '@/styles/records.css';

const HISTORY_LIST_LIMIT = 100;
const HISTORY_WORKOUT_LOG_LIMIT = 200;
const HISTORY_DELETE_DISMISS_KEY = 'history-delete-confirm-dismiss';

interface PendingDelete {
  cardId: string;
  historyId?: string;
  machineCode: string;
  recommendationId?: string;
  logDate: string;
  targetMuscleGroup?: string;
}

export function HistoryListPanel() {
  const { t, i18n } = useTranslation(['common', 'machines']);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get('date') ?? '';
  const focusId = searchParams.get('focus') ?? '';
  const logStatus = parseHistoryLogStatus(searchParams.get('logStatus'));
  const memberKey = activeMemberId ?? '';

  const calendarQueryKey = QUERY_KEYS.historyList(activeGymId ?? '', memberKey, {
    limit: HISTORY_LIST_LIMIT,
  });

  const { data: allHistory, isLoading: isAllHistoryLoading, isError } = useQuery({
    queryKey: calendarQueryKey,
    queryFn: async () => {
      const res = await historyApi.list(activeGymId!, {
        limit: HISTORY_LIST_LIMIT,
        memberId: activeMemberId ?? undefined,
      });
      return res.data.data;
    },
    enabled: Boolean(activeGymId) && memberScopeReady && Boolean(activeMemberId),
  });

  const { data: workoutLogs } = useQuery({
    queryKey: QUERY_KEYS.workoutLogsList(activeGymId ?? '', memberKey, {
      limit: HISTORY_WORKOUT_LOG_LIMIT,
    }),
    queryFn: () =>
      fetchWorkoutLogs({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        limit: HISTORY_WORKOUT_LOG_LIMIT,
      }),
    enabled: isAuthenticated && Boolean(activeGymId) && memberScopeReady && Boolean(activeMemberId),
  });

  const loggedKeys = useMemo(
    () => buildLoggedWorkoutKeys(workoutLogs ?? []),
    [workoutLogs]
  );

  const allRecordCards = useMemo(
    () => expandHistoryRecordCards(allHistory ?? [], workoutLogs ?? []),
    [allHistory, workoutLogs]
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

  const datesWithData = useMemo(
    () => extractRecordCardDateKeys(filteredAllCards),
    [filteredAllCards]
  );

  const groupedCards = useMemo(
    () => (displayCards.length ? groupRecordCardsByDate(displayCards) : []),
    [displayCards]
  );

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
      }),
    [
      displayCards,
      workoutLogs,
      comparisonData?.preferencesByMachine,
      liveAdjustedPrefs,
    ]
  );

  const translateMuscleGroup = (group: string) =>
    t(`machines:muscleGroups.${group}`, { defaultValue: group });

  const selectedDayMuscleGroups = useMemo(() => {
    if (!selectedDate) return [];
    const dayCards = filteredAllCards.filter((card) => card.logDate === selectedDate);
    return collectMuscleGroupsInOrder(dayCards);
  }, [filteredAllCards, selectedDate]);

  const isLoading = !activeGymId || !memberScopeReady || isAllHistoryLoading;

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

  const deleteMutation = useMutation({
    mutationFn: async ({
      historyId,
      machineCode,
      logDate,
      targetMuscleGroup,
    }: PendingDelete) => {
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
    },
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
      await queryClient.invalidateQueries({ queryKey: ['workout-logs', 'insights'] });
      showToast(t('machines:history.removed'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const requestDelete = (card: HistoryRecordCardData) => {
    const payload: PendingDelete = {
      cardId: card.cardId,
      historyId: card.historyId,
      machineCode: card.machineCode,
      recommendationId: card.recommendationId,
      logDate: card.logDate,
      targetMuscleGroup: card.targetMuscleGroup,
    };

    if (isDismissedToday(HISTORY_DELETE_DISMISS_KEY)) {
      deleteMutation.mutate(payload);
      return;
    }
    setPendingDelete(payload);
  };

  const confirmDelete = () => {
    if (pendingDelete) {
      deleteMutation.mutate(pendingDelete);
    }
  };

  if (isLoading) return <Skeleton count={2} height={120} />;
  if (isError) return <QueryErrorMessage />;

  const hasAnyRecords = allRecordCards.length > 0;

  if (!hasAnyRecords) {
    return (
      <EmptyState
        icon="history"
        title={t('machines:history.empty')}
        action={
          <Link to={ROUTES.MACHINES} className="btn btn--primary">
            {t('common:emptyState.browseMachines')}
          </Link>
        }
      />
    );
  }

  const emptyFilterTitle =
    logStatus === 'saved'
      ? t('machines:history.emptySaved')
      : logStatus === 'unsaved'
        ? t('machines:history.emptyUnsaved')
        : selectedDate
          ? t('machines:history.emptyOnDate')
          : t('machines:history.empty');

  return (
    <div className="records-list records-list--history history-page-premium">
      <div className="records-list__toolbar">
        <HistoryLogStatusFilter value={logStatus} onChange={handleLogStatusChange} />

        <div className="records-list__date-filter-block">
          <div className="records-list__filters">
            {datesWithData.size > 0 ? (
              <details className="records-list__calendar-details">
                <summary className="records-list__calendar-summary">
                  {selectedDate ? (
                    <span className="records-list__date-selected">
                      {formatHistoryDateHeaderWithMuscles(
                        selectedDate,
                        i18n.language,
                        selectedDayMuscleGroups,
                        translateMuscleGroup
                      )}
                    </span>
                  ) : null}
                  <span className="records-list__calendar-toggle">
                    <Icon
                      name="calendar"
                      size={14}
                      className="records-list__calendar-icon"
                    />
                    <span className="records-list__date-filter-label">
                      {t('machines:history.filterByDate')}
                    </span>
                    <Icon
                      name="chevronDown"
                      size={16}
                      className="records-list__calendar-chevron"
                    />
                  </span>
                </summary>
                <HistoryDateCalendar
                  datesWithData={datesWithData}
                  selectedDate={selectedDate}
                  onSelect={handleDateChange}
                  locale={i18n.language}
                />
              </details>
            ) : (
              <span className="records-list__calendar-toggle records-list__calendar-toggle--static">
                <Icon
                  name="calendar"
                  size={14}
                  className="records-list__calendar-icon"
                />
                <span className="records-list__date-filter-label">
                  {t('machines:history.filterByDate')}
                </span>
              </span>
            )}
            {selectedDate ? (
              <button
                type="button"
                className="records-list__date-reset"
                onClick={() => handleDateChange('')}
              >
                {t('machines:filterAll')}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {displayCards.length === 0 ? (
        <EmptyState
          icon="history"
          title={emptyFilterTitle}
          action={
            selectedDate || logStatus !== 'all' ? (
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
            ) : undefined
          }
        />
      ) : (
        <>
          {displayCards.length > 0 ? <HistorySummaryStats stats={summaryStats} /> : null}

          {groupedCards.map((group) => {
            const isExpanded = expandedDates.has(group.dateKey);
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

                return (
                  <HistoryRecordCard
                    key={card.cardId}
                    card={card}
                    resultUrl={resultUrl}
                    displayName={displayName}
                    muscleGroup={muscleGroup}
                    initialFitRating={fitRating}
                    initialCustomSettings={customSettings}
                    initialActiveSource={activeSource}
                    isAuthenticated={isAuthenticated}
                    lockTargetMuscle={Boolean(
                      card.targetMuscleGroup && isFreeWeightMachineCode(card.machineCode)
                    )}
                    isFocused={historyCardMatchesFocus(card, focusId)}
                    onDelete={() => requestDelete(card)}
                    deleteDisabled={deleteMutation.isPending}
                  />
                );
              })
                : null}
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
    </div>
  );
}
