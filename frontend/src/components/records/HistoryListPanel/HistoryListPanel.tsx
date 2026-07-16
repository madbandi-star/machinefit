import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { historyApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/recommendation.css';
import '@/styles/records.css';

export function HistoryListPanel() {
  const { t } = useTranslation(['common', 'machines']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.historyList(),
    queryFn: async () => {
      const res = await historyApi.list();
      return res.data.data;
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => historyApi.clear(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history }),
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  if (isLoading) return <Skeleton count={2} height={120} />;
  if (isError) return <QueryErrorMessage />;
  if (!data?.length) {
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
        <span className="records-list__count">{data.length}</span>
        <button
          type="button"
          className="records-list__clear"
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending}
        >
          {clearMutation.isPending ? '...' : t('machines:history.clearAll')}
        </button>
      </div>

      {data.map((item) => {
        const resultUrl = `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', item.machineCode)}?id=${item.recommendationId}`;

        return (
          <article key={item.id} className="saved-settings-card">
            <div className="saved-settings-card__header">
              <Link
                to={resultUrl}
                className="saved-settings-card__machine"
              >
                <strong className="saved-settings-card__machine-name">{item.machineName}</strong>
                <span className="saved-settings-card__machine-code">{item.machineCode}</span>
              </Link>
              <Link to={resultUrl} className="saved-settings-card__link">
                {t('machines:detail.viewLastResult')}
                <Icon name="chevronRight" size={16} />
              </Link>
            </div>
            <RecommendationSettingsPanel settings={item.settings} variant="hero" />
            <p className="saved-settings-card__date">
              {new Date(item.viewedAt).toLocaleDateString()}
            </p>
          </article>
        );
      })}
    </div>
  );
}
