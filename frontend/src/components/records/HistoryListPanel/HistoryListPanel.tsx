import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { historyApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/recommendation.css';
import '@/styles/components.css';

export function HistoryListPanel() {
  const { t } = useTranslation(['common', 'machines']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.history,
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

  if (isLoading) return <Skeleton count={3} height={80} />;
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
    <>
      <button
        type="button"
        className="btn btn--secondary"
        style={{ marginBottom: 'var(--space-md)' }}
        onClick={() => clearMutation.mutate()}
        disabled={clearMutation.isPending}
      >
        {clearMutation.isPending ? (
          <span className="btn__spinner" aria-hidden />
        ) : (
          t('machines:history.clearAll')
        )}
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {data.map((item) => (
          <div key={item.id} className="card record-card">
            <Link
              to={ROUTES.MACHINE_DETAIL.replace(':machineCode', item.machineCode)}
              className="record-card__header"
            >
              <strong className="record-card__title">{item.machineName}</strong>
              <span className="record-card__meta">
                {item.machineCode} · {new Date(item.viewedAt).toLocaleDateString()}
              </span>
            </Link>
            <RecommendationSettingsPanel settings={item.settings} variant="compact" />
            <Link
              to={`${ROUTES.RECOMMEND_RESULT.replace(':machineCode', item.machineCode)}?id=${item.recommendationId}`}
              className="btn btn--secondary btn--block"
            >
              {t('machines:detail.viewLastResult')}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
