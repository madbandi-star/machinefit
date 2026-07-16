import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { historyApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import '@/styles/components.css';

export function RecentHistoryPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.history,
    queryFn: async () => {
      const res = await historyApi.list();
      return res.data.data;
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => historyApi.clear(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history }),
  });

  return (
    <PageShell title={t('nav.history')} subtitle="Your recent recommendation history">
      {isLoading ? (
        <Skeleton count={3} height={80} />
      ) : data?.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No history yet. Get a recommendation first!</p>
      ) : (
        <>
          <button
            className="btn btn--secondary"
            style={{ marginBottom: '1rem' }}
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
          >
            Clear All
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data?.map((item) => (
              <div key={item.id} className="card">
                <strong>{item.machineName}</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                  {item.machineCode} · {new Date(item.viewedAt).toLocaleDateString()}
                </p>
                <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.85rem' }}>
                  {item.settings.seatPosition != null && (
                    <>
                      <dt>Seat</dt><dd>{item.settings.seatPosition}</dd>
                    </>
                  )}
                  {item.settings.recommendedWeightKg != null && (
                    <>
                      <dt>Weight</dt><dd>{item.settings.recommendedWeightKg} kg</dd>
                    </>
                  )}
                </dl>
              </div>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
