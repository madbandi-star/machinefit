import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { historyApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useUIStore } from '@/store/ui.store';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { formatBrandedMachineLabel } from '@/utils/freeWeightDisplay';
import '@/styles/components.css';
import '@/styles/recommendation.css';

export function RecentHistoryPage() {
  const { t } = useTranslation(['common', 'machines']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const memberKey = activeMemberId ?? '';

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.historyList(activeGymId ?? '', memberKey),
    queryFn: async () => {
      const res = await historyApi.list(activeGymId!, {
        ...(activeMemberId ? { memberId: activeMemberId } : {}),
      });
      return res.data.data;
    },
    enabled: Boolean(activeGymId) && memberScopeReady,
  });

  const clearMutation = useMutation({
    mutationFn: () => historyApi.clear(activeGymId!, activeMemberId ?? undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history }),
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  return (
    <PageShell title={t('common:nav.history')} subtitle={t('machines:history.subtitle')}>
      {isLoading || !activeGymId || !memberScopeReady ? (
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
                <strong>
                  {formatBrandedMachineLabel(item.machineName, item.brandName, item.machineCode)}
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                  {new Date(item.viewedAt).toLocaleDateString()}
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
