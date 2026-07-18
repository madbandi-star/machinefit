import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { SegmentedControl } from '@/components/form/SegmentedControl/SegmentedControl';
import '@/styles/admin.css';

const ROLE_OPTIONS = [
  { value: 'member' as const, label: 'member' },
  { value: 'owner' as const, label: 'owner' },
  { value: 'admin' as const, label: 'admin' },
];

export function AdminUsersPage() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminUsers,
    queryFn: async () => {
      const res = await adminApi.listUsers({ limit: 50 });
      return res.data.data.items;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, roleCode, isActive }: { id: string; roleCode?: 'member' | 'owner' | 'admin'; isActive?: boolean }) =>
      adminApi.updateUser(id, { roleCode, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  if (isLoading) {
    return (
      <PageShell title={t('users')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t('users')}>
      <div className="admin-table">
        {data?.map((user) => (
          <div key={user.id} className="card admin-table__row">
            <div>
              <strong>{user.displayName}</strong>
              <p className="admin-table__meta">{user.email}</p>
            </div>
            <div className="admin-table__actions">
              <SegmentedControl
                className="admin-role-segment"
                size="compact"
                value={user.roleCode as 'member' | 'owner' | 'admin'}
                options={ROLE_OPTIONS}
                onChange={(roleCode) =>
                  updateMutation.mutate({
                    id: user.id,
                    roleCode,
                  })
                }
                ariaLabel={t('users')}
              />
              <button
                className="btn btn--secondary"
                onClick={() =>
                  updateMutation.mutate({ id: user.id, isActive: !user.isActive })
                }
              >
                {user.isActive ? t('disable') : t('enable')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
