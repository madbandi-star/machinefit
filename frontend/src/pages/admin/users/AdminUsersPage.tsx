import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ASSIGNABLE_ROLE_CODES,
  USERNAME_MAX_LENGTH,
  validateUsername,
  type RoleCode,
} from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';

const PAGE_SIZE = 50;

type StatusFilter = 'all' | 'active' | 'inactive';

export function AdminUsersPage() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftUsername, setDraftUsername] = useState('');

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
      displayName,
    }: {
      id: string;
      roleCode?: RoleCode;
      isActive?: boolean;
      displayName?: string;
    }) => adminApi.updateUser(id, { roleCode, isActive, displayName }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
      setEditingId(null);
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const items = data?.items ?? [];
  const total = data?.meta.total ?? items.length;
  const totalPages = data?.meta.totalPages ?? 1;
  const currentPage = data?.meta.page ?? page;

  const pageStats = useMemo(() => {
    const active = items.filter((u) => u.isActive).length;
    const inactive = items.length - active;
    return { active, inactive, onPage: items.length };
  }, [items]);

  const visible = useMemo(() => {
    let list = items;
    if (statusFilter === 'active') list = list.filter((u) => u.isActive);
    else if (statusFilter === 'inactive') list = list.filter((u) => !u.isActive);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => {
      const hay = `${u.displayName ?? ''} ${u.id ?? ''} ${u.roleCode ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, statusFilter, search]);

  if (isLoading && !data) {
    return (
      <AdminPageShell title={t('users')} subtitle={t('usersSubtitle')}>
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  const openRow = (userId: string, displayName: string) => {
    const next = expandedId === userId ? null : userId;
    setExpandedId(next);
    if (next) {
      setEditingId(userId);
      setDraftUsername(displayName);
    } else {
      setEditingId(null);
    }
  };

  return (
    <AdminPageShell title={t('users')} subtitle={t('usersSubtitle')}>
      <div className="ag">
        <section className="ag-kpis" aria-label={t('usersStats')}>
          <button
            type="button"
            className={`ag-kpi${statusFilter === 'all' ? ' is-active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span className="ag-kpi__value">{total}</span>
            <span className="ag-kpi__label">{t('usersStatTotal')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${statusFilter === 'active' ? ' is-active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            <span className="ag-kpi__value">{pageStats.active}</span>
            <span className="ag-kpi__label">{t('usersStatActivePage')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${statusFilter === 'inactive' ? ' is-active' : ''}${
              pageStats.inactive > 0 ? ' is-muted' : ''
            }`}
            onClick={() => setStatusFilter('inactive')}
          >
            <span className="ag-kpi__value">{pageStats.inactive}</span>
            <span className="ag-kpi__label">{t('usersStatInactivePage')}</span>
          </button>
        </section>

        <p className="ag-chart-hint">{t('usersFilterLocalNote')}</p>

        <section className="ag-panel">
          <div className="ag-toolbar">
            <input
              type="search"
              className="ag-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('usersSearchPlaceholder')}
              aria-label={t('usersSearchPlaceholder')}
            />
          </div>
          {visible.length === 0 ? (
            <p className="ag-empty">{t('noUsers')}</p>
          ) : (
            <div className="ag-queue">
              {visible.map((user) => {
                const open = expandedId === user.id;
                const editing = editingId === user.id;
                return (
                  <article
                    key={user.id}
                    className={[
                      'ag-card',
                      user.isActive ? 'is-on' : 'is-off',
                      open ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <button
                      type="button"
                      className="ag-card__main"
                      onClick={() => openRow(user.id, user.displayName)}
                    >
                      <span className="ag-card__identity">
                        <span className="ag-card__title">{user.displayName}</span>
                        <span className="ag-card__meta">
                          {user.id.slice(0, 8)}
                          {' · '}
                          {user.roleCode}
                        </span>
                      </span>
                      <span className={`ag-pill ${user.isActive ? 'ag-pill--on' : 'ag-pill--off'}`}>
                        {user.isActive ? t('active') : t('inactive')}
                      </span>
                      <span className="ag-card__chevron" aria-hidden>
                        {open ? '▾' : '▸'}
                      </span>
                    </button>
                    {open ? (
                      <div className="ag-card__detail">
                        <label className="ag-field ag-field--full">
                          <span>{t('username')}</span>
                          <input
                            className="input"
                            value={editing ? draftUsername : user.displayName}
                            maxLength={USERNAME_MAX_LENGTH}
                            onChange={(e) => {
                              setEditingId(user.id);
                              setDraftUsername(e.target.value);
                            }}
                            aria-label={t('username')}
                          />
                        </label>
                        <label className="ag-field">
                          <span>{t('role')}</span>
                          <select
                            className="input"
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
                        <div className="ag-card__actions">
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            disabled={updateMutation.isPending}
                            onClick={() => {
                              const validated = validateUsername(draftUsername);
                              if (!validated.ok) {
                                showToast(t('usernameInvalid'), 'error');
                                return;
                              }
                              updateMutation.mutate({
                                id: user.id,
                                displayName: validated.normalized,
                              });
                            }}
                          >
                            {t('saveUsername')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            disabled={updateMutation.isPending}
                            onClick={() => {
                              setDraftUsername(user.displayName);
                              setEditingId(user.id);
                            }}
                          >
                            {t('cancelUsername')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            disabled={updateMutation.isPending}
                            onClick={() =>
                              updateMutation.mutate({ id: user.id, isActive: !user.isActive })
                            }
                          >
                            {user.isActive ? t('disable') : t('enable')}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              setExpandedId(null);
              setEditingId(null);
            }}
          />
        </section>
      </div>
    </AdminPageShell>
  );
}
