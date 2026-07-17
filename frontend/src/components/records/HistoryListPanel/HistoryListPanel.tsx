import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import { Icon } from '@/components/icons/Icon';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { HistoryLogStatusFilter } from '@/components/records/HistoryLogStatusFilter/HistoryLogStatusFilter';
import { historyApi, workoutLogApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { WorkoutLogPanel } from '@/components/recommendation/WorkoutLogPanel/WorkoutLogPanel';
import {
  extractHistoryDateKeys,
  formatHistoryDateHeader,
  formatHistoryTime,
  getLocalDayRange,
  getLocalDateKey,
  groupHistoryByDate,
} from '@/utils/historyDate';
import {
  buildLoggedWorkoutKeys,
  filterHistoryByLogStatus,
  historyItemHasWorkoutLog,
  parseHistoryLogStatus,
  type HistoryLogStatus,
} from '@/utils/historyLogStatus';
import { HistoryDateCalendar } from '@/components/records/HistoryDateCalendar/HistoryDateCalendar';
import '@/styles/recommendation.css';
import '@/styles/records.css';

const HISTORY_LIST_LIMIT = 100;

export function HistoryListPanel() {
  const { t, i18n } = useTranslation(['common', 'machines']);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get('date') ?? '';
  const focusId = searchParams.get('focus') ?? '';
  const logStatus = parseHistoryLogStatus(searchParams.get('logStatus'));

  const calendarQueryKey = QUERY_KEYS.historyList({ limit: HISTORY_LIST_LIMIT });

  const { data: allHistory, isLoading: isAllHistoryLoading } = useQuery({
    queryKey: calendarQueryKey,
    queryFn: async () => {
      const res = await historyApi.list({ limit: HISTORY_LIST_LIMIT });
      return res.data.data;
    },
  });

  const { data: workoutLogs, isLoading: isWorkoutLogsLoading } = useQuery({
    queryKey: QUERY_KEYS.workoutLogsAll,
    queryFn: async () => {
      const res = await workoutLogApi.list();
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  const loggedKeys = useMemo(
    () => buildLoggedWorkoutKeys(workoutLogs ?? []),
    [workoutLogs]
  );

  const listParams = useMemo(() => {
    if (!selectedDate) {
      return { limit: HISTORY_LIST_LIMIT };
    }

    const { from, to } = getLocalDayRange(selectedDate);
    return { limit: HISTORY_LIST_LIMIT, from, to };
  }, [selectedDate]);

  const { data, isLoading: isListLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.historyList(listParams),
    queryFn: async () => {
      const res = await historyApi.list(listParams);
      return res.data.data;
    },
  });

  const filteredAllHistory = useMemo(
    () => filterHistoryByLogStatus(allHistory ?? [], loggedKeys, logStatus),
    [allHistory, loggedKeys, logStatus]
  );

  const filteredData = useMemo(
    () => filterHistoryByLogStatus(data ?? [], loggedKeys, logStatus),
    [data, loggedKeys, logStatus]
  );

  const datesWithData = useMemo(
    () => extractHistoryDateKeys(filteredAllHistory),
    [filteredAllHistory]
  );

  const groupedItems = useMemo(
    () => (filteredData.length ? groupHistoryByDate(filteredData) : []),
    [filteredData]
  );

  const isLoading = isAllHistoryLoading || isListLoading || isWorkoutLogsLoading;

  useEffect(() => {
    if (!focusId || isLoading || filteredData.length === 0) return;

    const element = document.getElementById(`history-item-${focusId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('saved-settings-card--focused');

    const timer = window.setTimeout(() => {
      element.classList.remove('saved-settings-card--focused');
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('focus');
          return next;
        },
        { replace: true }
      );
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [focusId, isLoading, filteredData, setSearchParams]);

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

  if (isLoading) return <Skeleton count={2} height={120} />;
  if (isError) return <QueryErrorMessage />;

  const hasAnyHistory = Boolean(allHistory?.length);

  if (!hasAnyHistory) {
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
    <div className="records-list records-list--history">
      <div className="records-list__toolbar">
        <HistoryLogStatusFilter value={logStatus} onChange={handleLogStatusChange} />

        <div className="records-list__date-filter-block">
          <div className="records-list__filters">
            {datesWithData.size > 0 ? (
              <details className="records-list__calendar-details">
                <summary className="records-list__calendar-summary">
                  {selectedDate ? (
                    <span className="records-list__date-selected">
                      {formatHistoryDateHeader(selectedDate, i18n.language)}
                    </span>
                  ) : null}
                  <span className="records-list__calendar-toggle">
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
              <span className="records-list__date-filter-label">
                {t('machines:history.filterByDate')}
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

      {filteredData.length === 0 ? (
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
        groupedItems.map((group) => (
          <section key={group.dateKey} className="records-list__date-group">
            <h2 className="records-list__date-heading">
              {formatHistoryDateHeader(group.dateKey, i18n.language)}
            </h2>

            {group.items.map((item) => {
              const resultUrl = `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', item.machineCode)}?id=${item.recommendationId}`;
              const logDate = getLocalDateKey(item.viewedAt);
              const hasWorkoutLog = historyItemHasWorkoutLog(item, loggedKeys);

              return (
                <article
                  key={item.id}
                  id={`history-item-${item.id}`}
                  className={`saved-settings-card saved-settings-card--history${hasWorkoutLog ? ' saved-settings-card--logged' : ' saved-settings-card--unlogged'}${focusId === item.id ? ' saved-settings-card--focused' : ''}`}
                >
                  <div className="saved-settings-card__header">
                    <Link to={resultUrl} className="saved-settings-card__machine">
                      <div className="saved-settings-card__machine-title-row">
                        <MachineNameWithMuscle
                          muscleGroup={item.muscleGroup}
                          name={item.machineName}
                          iconSize={20}
                          labelClassName="saved-settings-card__machine-name"
                        />
                        <span
                          className={`saved-settings-card__log-badge${hasWorkoutLog ? ' saved-settings-card__log-badge--saved' : ' saved-settings-card__log-badge--unsaved'}`}
                        >
                          {hasWorkoutLog
                            ? t('machines:history.workoutSavedBadge')
                            : t('machines:history.workoutUnsavedBadge')}
                        </span>
                      </div>
                      <span className="saved-settings-card__time saved-settings-card__time--inline">
                        {formatHistoryTime(item.viewedAt, i18n.language)}
                      </span>
                    </Link>
                  </div>
                  <Link
                    to={resultUrl}
                    className="saved-settings-card__detail-link"
                    aria-label={t('machines:detail.viewLastResult')}
                  >
                    <RecommendationSettingsPanel settings={item.settings} variant="compact" />
                  </Link>
                  <WorkoutLogPanel
                    key={`${item.machineCode}-${logDate}`}
                    machineCode={item.machineCode}
                    recommendationId={item.recommendationId}
                    suggestedWeightKg={item.settings.recommendedWeightKg}
                    isAuthenticated={isAuthenticated}
                    variant="compact"
                    logDate={logDate}
                    idPrefix={`history-workout-${item.id}`}
                  />
                </article>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}
