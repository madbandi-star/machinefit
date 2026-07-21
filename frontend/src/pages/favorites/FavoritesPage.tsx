import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { favoriteApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useUIStore } from '@/store/ui.store';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { formatBrandedMachineLabel } from '@/utils/freeWeightDisplay';
import '@/styles/components.css';

export function FavoritesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const { activeGymId } = useActiveGym();
  const favoritesKey = QUERY_KEYS.favorites(activeGymId ?? '');

  const { data, isLoading, isError } = useQuery({
    queryKey: favoritesKey,
    queryFn: async () => {
      const res = await favoriteApi.list(activeGymId!);
      return res.data.data;
    },
    enabled: Boolean(activeGymId),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => favoriteApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: favoritesKey }),
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  return (
    <PageShell title={t('nav.favorites')} subtitle="Your saved machines and recommendations">
      {isLoading || !activeGymId ? (
        <Skeleton count={3} height={80} />
      ) : isError ? (
        <QueryErrorMessage />
      ) : data?.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No favorites yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data?.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>
                  {formatBrandedMachineLabel(item.machineName, item.brandName, item.machineCode)}
                </strong>
              </div>
              <button
                className="btn btn--secondary"
                onClick={() => removeMutation.mutate(item.id)}
                disabled={removeMutation.isPending}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
