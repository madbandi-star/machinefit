import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { GymMachine } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/gym.css';

export function AdminGymsPage() {
  const { t } = useTranslation(['admin', 'gyms', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [expandedGymId, setExpandedGymId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminGyms,
    queryFn: async () => {
      const res = await adminApi.listGyms();
      return res.data.data;
    },
  });

  const inventoryQuery = useQuery({
    queryKey: QUERY_KEYS.adminGymInventory(expandedGymId ?? ''),
    queryFn: async () => {
      const res = await adminApi.listGymInventory(expandedGymId!, { includeDeleted: true });
      return res.data.data;
    },
    enabled: Boolean(expandedGymId),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      adminApi.verifyGym(id, { isVerified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminGyms });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDashboard });
      showToast(t('admin:saved'), 'success');
    },
    onError: () => showToast(t('admin:error'), 'error'),
  });

  const inventoryAction = useMutation({
    mutationFn: (payload: { itemId: string; action: 'restore' | 'force_delete' }) =>
      adminApi.gymMachineAction(payload.itemId, { action: payload.action }),
    onSuccess: async (_data, variables) => {
      showToast(
        variables.action === 'restore'
          ? t('admin:inventory.restored')
          : t('admin:inventory.forceDeleted'),
        'success'
      );
      if (expandedGymId) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.adminGymInventory(expandedGymId),
        });
      }
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  if (isLoading) {
    return (
      <PageShell title={t('admin:gyms')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t('admin:gyms')}>
      <div className="admin-table">
        {data?.map((gym) => (
          <div key={gym.id} className="card admin-table__row admin-gym-card">
            <div>
              <strong>{gym.name}</strong>
              <p className="admin-table__meta">
                {gym.city} · {gym.machineCount ?? 0} machines
                {gym.isVerified && ' · ✓ Verified'}
              </p>
            </div>
            <div className="admin-gym-card__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() =>
                  setExpandedGymId((prev) => (prev === gym.id ? null : gym.id))
                }
              >
                {t('admin:inventory.manage')}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() =>
                  verifyMutation.mutate({ id: gym.id, isVerified: !gym.isVerified })
                }
              >
                {gym.isVerified ? t('admin:unverify') : t('admin:verify')}
              </button>
            </div>

            {expandedGymId === gym.id ? (
              <div className="admin-gym-inventory">
                {inventoryQuery.isLoading ? (
                  <Skeleton count={2} height={48} />
                ) : !inventoryQuery.data?.length ? (
                  <p>{t('admin:inventory.empty')}</p>
                ) : (
                  <ul>
                    {inventoryQuery.data.map((item: GymMachine) => (
                      <li key={item.id} className="admin-gym-inventory__item">
                        <div>
                          <strong>
                            {item.brandName ? `${item.brandName} · ` : ''}
                            {item.machineName}
                          </strong>
                          <p>
                            {item.isVerified ? 'official' : 'member'} ·{' '}
                            {item.deletedAt ? 'deleted' : 'active'}
                          </p>
                        </div>
                        <div className="admin-gym-inventory__actions">
                          {item.deletedAt ? (
                            <button
                              type="button"
                              className="btn btn--secondary"
                              onClick={() =>
                                inventoryAction.mutate({
                                  itemId: item.id,
                                  action: 'restore',
                                })
                              }
                            >
                              {t('admin:inventory.restore')}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="btn btn--danger"
                            onClick={() =>
                              inventoryAction.mutate({
                                itemId: item.id,
                                action: 'force_delete',
                              })
                            }
                          >
                            {t('admin:inventory.forceDelete')}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
