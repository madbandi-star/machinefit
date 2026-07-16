import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { historyApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/recommendation.css';

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
    return <p style={{ color: 'var(--color-text-muted)' }}>{t('machines:history.empty')}</p>;
  }

  return (
    <>
      <button
        type="button"
        className="btn btn--secondary"
        style={{ marginBottom: '1rem' }}
        onClick={() => clearMutation.mutate()}
        disabled={clearMutation.isPending}
      >
        {t('machines:history.clearAll')}
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {data.map((item) => (
          <div key={item.id} className="card">
            <Link
              to={ROUTES.MACHINE_DETAIL.replace(':machineCode', item.machineCode)}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <strong>{item.machineName}</strong>
            </Link>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0.75rem' }}>
              {item.machineCode} · {new Date(item.viewedAt).toLocaleDateString()}
            </p>
            <RecommendationSettingsPanel settings={item.settings} variant="compact" />
            <Link
              to={`${ROUTES.RECOMMEND_RESULT.replace(':machineCode', item.machineCode)}?id=${item.recommendationId}`}
              className="btn btn--secondary btn--block"
              style={{ marginTop: '0.75rem' }}
            >
              {t('machines:detail.viewLastResult')}
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
