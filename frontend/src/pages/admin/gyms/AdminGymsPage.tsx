import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';

export function AdminGymsPage() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminGyms,
    queryFn: async () => {
      const res = await adminApi.listGyms();
      return res.data.data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      adminApi.verifyGym(id, { isVerified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminGyms });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  if (isLoading) {
    return (
      <PageShell title={t('gyms')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t('gyms')}>
      <div className="admin-table">
        {data?.map((gym) => (
          <div key={gym.id} className="card admin-table__row">
            <div>
              <strong>{gym.name}</strong>
              <p className="admin-table__meta">
                {gym.city} · {gym.machineCount ?? 0} machines
                {gym.isVerified && ' · ✓ Verified'}
              </p>
            </div>
            <button
              className="btn btn--secondary"
              onClick={() => verifyMutation.mutate({ id: gym.id, isVerified: !gym.isVerified })}
            >
              {gym.isVerified ? t('unverify') : t('verify')}
            </button>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
