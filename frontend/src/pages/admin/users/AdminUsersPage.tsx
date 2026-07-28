import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ASSIGNABLE_ROLE_CODES, type RoleCode } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';

const PAGE_SIZE = 50;

export function AdminUsersPage() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.adminUsers, page, PAGE_SIZE],
    queryFn: async () => {
      const res = await adminApi.listUsers({ page, limit: PAGE_SIZE });
      return res.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      roleCode,
      isActive,
    }: {
      id: string;
      roleCode?: RoleCode;
      isActive?: boolean;
    }) => adminApi.updateUser(id, { roleCode, isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  if (isLoading && !data) {
    return (
      <AdminPageShell title={t('users')} subtitle={t('menu.usersDesc')}>
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  const items = data?.items ?? [];
  const total = data?.meta.total ?? items.length;
  const totalPages = data?.meta.totalPages ?? 1;
  const currentPage = data?.meta.page ?? page;

  return (
    <AdminPageShell title={t('users')} subtitle={t('menu.usersDesc')}>
      <AdminPanel count={total} countLabel={t('listCount', { count: total })}>
        <div className="admin-table admin-table--dense">
          {items.length === 0 ? (
            <div className="admin-empty">{t('noUsers')}</div>
          ) : (
            items.map((user) => (
              <div key={user.id} className="card admin-table__row">
                <div className="admin-table__primary">
                  <div className="admin-table__title-row">
                    <strong>{user.displayName}</strong>
                    <span
                      className={`admin-status-pill${user.isActive ? ' is-active' : ' is-inactive'}`}
                    >
                      {user.isActive ? t('active') : t('inactive')}
                    </span>
                  </div>
                  <p className="admin-table__meta">{user.email}</p>
                </div>
                <div className="admin-table__actions">
                  <label className="admin-role-select">
                    <span className="visually-hidden">{t('role')}</span>
                    <select
                      className="admin-select"
                      value={user.roleCode}
                      onChange={(e) =>
                        updateMutation.mutate({
                          id: user.id,
                          roleCode: e.target.value as RoleCode,
                        })
                      }
                      disabled={updateMutation.isPending}
                    >
                      {ASSIGNABLE_ROLE_CODES.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() =>
                      updateMutation.mutate({ id: user.id, isActive: !user.isActive })
                    }
                  >
                    {user.isActive ? t('disable') : t('enable')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(nextPage) => setPage(nextPage)}
        />
      </AdminPanel>
    </AdminPageShell>
  );
}
