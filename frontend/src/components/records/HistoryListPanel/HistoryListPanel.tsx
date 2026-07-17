import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { Icon } from '@/components/icons/Icon';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { historyApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import {
  formatHistoryDateHeader,
  formatHistoryTime,
  getLocalDateKey,
  getLocalDayRange,
  groupHistoryByDate,
} from '@/utils/historyDate';
import '@/styles/recommendation.css';
import '@/styles/records.css';

const HISTORY_LIST_LIMIT = 100;

export function HistoryListPanel() {
  const { t, i18n } = useTranslation(['common', 'machines']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get('date') ?? '';

  const listParams = useMemo(() => {
    if (!selectedDate) {
      return { limit: HISTORY_LIST_LIMIT };
    }

    const { from, to } = getLocalDayRange(selectedDate);
    return { limit: HISTORY_LIST_LIMIT, from, to };
  }, [selectedDate]);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.historyList(listParams),
    queryFn: async () => {
      const res = await historyApi.list(listParams);
      return res.data.data;
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => historyApi.clear(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history }),
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const groupedItems = useMemo(
    () => (data?.length ? groupHistoryByDate(data) : []),
    [data]
  );

  const availableDates = useMemo(() => {
    if (selectedDate || !data?.length) return [];
    return groupedItems.map((group) => group.dateKey);
  }, [data, groupedItems, selectedDate]);

  const handleDateChange = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set('date', value);
        } else {
          next.delete('date');
        }
        if (!next.get('tab')) {
          next.set('tab', 'history');
        }
        return next;
      },
      { replace: true }
    );
  };

  if (isLoading) return <Skeleton count={2} height={120} />;
  if (isError) return <QueryErrorMessage />;

  const hasAnyHistory = Boolean(data?.length) || Boolean(selectedDate);

  if (!hasAnyHistory && !selectedDate) {
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

  return (
    <div className="records-list">
      <div className="records-list__toolbar">
        <div className="records-list__filters">
          <label className="records-list__date-filter">
            <span className="records-list__date-filter-label">
              {t('machines:history.filterByDate')}
            </span>
            <input
              type="date"
              className="records-list__date-input"
              value={selectedDate}
              max={availableDates[0] ?? getLocalDateKey(new Date().toISOString())}
              onChange={(event) => handleDateChange(event.target.value)}
            />
          </label>
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

        <button
          type="button"
          className="records-list__clear"
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending || !data?.length}
        >
          {clearMutation.isPending ? '...' : t('machines:history.clearAll')}
        </button>
      </div>

      {!data?.length ? (
        <EmptyState
          icon="history"
          title={t('machines:history.emptyOnDate')}
          action={
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => handleDateChange('')}
            >
              {t('machines:filterAll')}
            </button>
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

              return (
                <article key={item.id} className="saved-settings-card">
                  <div className="saved-settings-card__header">
                    <Link to={resultUrl} className="saved-settings-card__machine">
                      <strong className="saved-settings-card__machine-name">{item.machineName}</strong>
                      <span className="saved-settings-card__machine-code">{item.machineCode}</span>
                    </Link>
                    <Link to={resultUrl} className="saved-settings-card__link">
                      {t('machines:detail.viewLastResult')}
                      <Icon name="chevronRight" size={16} />
                    </Link>
                  </div>
                  <RecommendationSettingsPanel settings={item.settings} variant="hero" />
                  <p className="saved-settings-card__time">
                    {formatHistoryTime(item.viewedAt, i18n.language)}
                  </p>
                </article>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}
