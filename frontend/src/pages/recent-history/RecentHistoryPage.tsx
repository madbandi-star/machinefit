import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { historyApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import '@/styles/components.css';
import '@/styles/recommendation.css';

export function RecentHistoryPage() {
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

  return (
    <PageShell title={t('common:nav.history')} subtitle={t('machines:history.subtitle')}>
      {isLoading ? (
        <Skeleton count={3} height={80} />
      ) : isError ? (
        <QueryErrorMessage />
      ) : data?.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>{t('machines:history.empty')}</p>
      ) : (
        <>
          <button
            className="btn btn--secondary"
            style={{ marginBottom: '1rem' }}
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
          >
            {t('machines:history.clearAll')}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data?.map((item) => (
              <div key={item.id} className="card">
                <strong>{item.machineName}</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                  {item.machineCode} · {new Date(item.viewedAt).toLocaleDateString()}
                </p>
                <RecommendationSettingsPanel settings={item.settings} variant="compact" />
              </div>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
