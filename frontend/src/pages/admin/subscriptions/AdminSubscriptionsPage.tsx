import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BillingPlanCode, SubscriptionStatus } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminBillingApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';

const PAGE_SIZE = 50;
const STATUS_FILTERS = [
  '',
  'ACTIVE',
  'TRIAL',
  'EXPIRED',
  'CANCELED',
  'PAUSED',
  'PENDING',
  'FAILED',
  'NONE',
  'expiring',
] as const;

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export function AdminSubscriptionsPage() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');

  const params = useMemo(
    () => ({
      q: search || undefined,
      status: status || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [search, status, page]
  );

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminSubscriptions(params),
    queryFn: async () => {
      const res = await adminBillingApi.list(params);
      return res.data.data;
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
  };

  const extendMutation = useMutation({
    mutationFn: ({ userId, days }: { userId: string; days: number }) =>
      adminBillingApi.extend(userId, { days }),
    onSuccess: () => {
      invalidate();
      showToast(t('subscriptions.extended'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const endMutation = useMutation({
    mutationFn: (userId: string) => adminBillingApi.end(userId),
    onSuccess: () => {
      invalidate();
      showToast(t('subscriptions.ended'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const setMutation = useMutation({
    mutationFn: ({
      userId,
      planCode,
      status: nextStatus,
    }: {
      userId: string;
      planCode: BillingPlanCode;
      status: SubscriptionStatus;
    }) => adminBillingApi.set(userId, { planCode, status: nextStatus, days: 30 }),
    onSuccess: () => {
      invalidate();
      showToast(t('subscriptions.updated'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  if (isLoading && !data) {
    return (
      <AdminPageShell title={t('subscriptions.nav')} subtitle={t('subscriptions.desc')}>
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  const items = data?.items ?? [];
  const total = data?.meta.total ?? items.length;
  const totalPages = data?.meta.totalPages ?? 1;
  const currentPage = data?.meta.page ?? page;
  const busy =
    extendMutation.isPending || endMutation.isPending || setMutation.isPending;

  return (
    <AdminPageShell title={t('subscriptions.nav')} subtitle={t('subscriptions.desc')}>
      <div className="admin-toolbar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          className="admin-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('subscriptions.searchPlaceholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              setSearch(q.trim());
            }
          }}
        />
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            setPage(1);
            setSearch(q.trim());
          }}
        >
          {t('subscriptions.search')}
        </button>
        <select
          className="admin-select"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s || 'all'} value={s}>
              {s ? t(`subscriptions.status.${s}`, { defaultValue: s }) : t('subscriptions.allStatuses')}
            </option>
          ))}
        </select>
      </div>

      <AdminPanel count={total} countLabel={t('listCount', { count: total })}>
        <div className="admin-table admin-table--dense">
          {items.length === 0 ? (
            <div className="admin-empty">{t('subscriptions.empty')}</div>
          ) : (
            items.map((row) => (
              <div key={row.userId} className="card admin-table__row">
                <div className="admin-table__primary">
                  <div className="admin-table__title-row">
                    <strong>{row.displayName}</strong>
                    <span className="admin-status-pill">{row.status}</span>
                  </div>
                  <p className="admin-table__meta">{row.email}</p>
                  <p className="admin-table__meta">
                    {t('subscriptions.plan')}: {row.planCode ?? 'FREE'} ·{' '}
                    {t('subscriptions.entitlement')}: {row.entitlementPlan} ·{' '}
                    {t('role')}: {row.roleCode}
                  </p>
                  <p className="admin-table__meta">
                    {t('subscriptions.trial')}:{' '}
                    {row.isTrial
                      ? t('subscriptions.trialActive')
                      : row.trialConsumed
                        ? t('subscriptions.trialUsed')
                        : t('subscriptions.trialAvailable')}
                    {' · '}
                    {t('subscriptions.expire')}: {formatDate(row.expireAt)}
                  </p>
                </div>
                <div className="admin-table__actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <select
                    className="admin-select"
                    defaultValue=""
                    disabled={busy}
                    onChange={(e) => {
                      const value = e.target.value as BillingPlanCode | '';
                      e.target.value = '';
                      if (!value) return;
                      setMutation.mutate({
                        userId: row.userId,
                        planCode: value,
                        status: value === 'FREE' ? 'CANCELED' : 'ACTIVE',
                      });
                    }}
                  >
                    <option value="">{t('subscriptions.setPlan')}</option>
                    <option value="FREE">FREE</option>
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="VIP">VIP</option>
                  </select>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    disabled={busy}
                    onClick={() => extendMutation.mutate({ userId: row.userId, days: 30 })}
                  >
                    {t('subscriptions.extend30')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(t('subscriptions.endConfirm'))) {
                        endMutation.mutate(row.userId);
                      }
                    }}
                  >
                    {t('subscriptions.end')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </AdminPanel>

      {totalPages > 1 ? (
        <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      ) : null}
    </AdminPageShell>
  );
}
