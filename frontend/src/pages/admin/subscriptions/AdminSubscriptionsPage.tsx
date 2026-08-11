import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ADMIN_BILLING_STEP_UP_CONFIRM,
  type BillingPlanCode,
  type SubscriptionStatus,
} from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminBillingApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-subscriptions.css';

const PAGE_SIZE = 50;

const STATUS_CHIPS = ['', 'ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELED', 'expiring'] as const;
const STATUS_MORE = ['PAUSED', 'PENDING', 'FAILED', 'NONE'] as const;

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function statusPillClass(status: string): string {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return 'admin-status-pill is-active';
  if (s === 'TRIAL') return 'admin-status-pill is-verified';
  if (s === 'FAILED') return 'admin-status-pill is-danger';
  if (s === 'PENDING' || s === 'PAUSED') return 'admin-status-pill is-pending';
  if (s === 'EXPIRED' || s === 'CANCELED' || s === 'CANCELLED' || s === 'NONE') {
    return 'admin-status-pill is-inactive';
  }
  return 'admin-status-pill';
}

function trialLabel(
  t: (key: string) => string,
  row: { isTrial: boolean; trialConsumed: boolean }
): string {
  if (row.isTrial) return t('subscriptions.trialActive');
  if (row.trialConsumed) return t('subscriptions.trialUsed');
  return t('subscriptions.trialAvailable');
}

export function AdminSubscriptionsPage() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [stepUpText, setStepUpText] = useState('');

  const requireStepUp = (): string | null => {
    const value = stepUpText.trim().toUpperCase();
    if (value !== ADMIN_BILLING_STEP_UP_CONFIRM) {
      showToast(t('subscriptions.stepUpRequired'), 'error');
      return null;
    }
    return ADMIN_BILLING_STEP_UP_CONFIRM;
  };

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
    mutationFn: ({ userId, days, confirmText }: { userId: string; days: number; confirmText: string }) =>
      adminBillingApi.extend(userId, { days, confirmText }),
    onSuccess: () => {
      invalidate();
      showToast(t('subscriptions.extended'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const endMutation = useMutation({
    mutationFn: ({ userId, confirmText }: { userId: string; confirmText: string }) =>
      adminBillingApi.end(userId, { confirmText }),
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
      confirmText,
    }: {
      userId: string;
      planCode: BillingPlanCode;
      status: SubscriptionStatus;
      confirmText: string;
    }) => adminBillingApi.set(userId, { planCode, status: nextStatus, days: 30, confirmText }),
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
  const moreSelected = STATUS_MORE.includes(status as (typeof STATUS_MORE)[number]);

  const applySearch = () => {
    setPage(1);
    setSearch(q.trim());
  };

  const setStatusFilter = (next: string) => {
    setPage(1);
    setStatus(next);
  };

  return (
    <AdminPageShell title={t('subscriptions.nav')} subtitle={t('subscriptions.desc')}>
      <div className="admin-subs">
        <p className="admin-subs__stepup-help">{t('subscriptions.stepUpHint')}</p>
        <label className="admin-subs__stepup">
          <span>{t('subscriptions.stepUpLabel')}</span>
          <input
            className="input"
            value={stepUpText}
            onChange={(e) => setStepUpText(e.target.value)}
            placeholder={t('subscriptions.stepUpPlaceholder')}
            autoComplete="off"
          />
        </label>
        <div className="admin-toolbar admin-subs__toolbar">
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('subscriptions.searchPlaceholder')}
            aria-label={t('subscriptions.searchPlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applySearch();
            }}
          />
          <button type="button" className="btn btn--secondary" onClick={applySearch}>
            {t('subscriptions.search')}
          </button>
        </div>

        <div className="admin-subs__filters" role="group" aria-label={t('subscriptions.allStatuses')}>
          {STATUS_CHIPS.map((chip) => {
            const active = status === chip;
            const label = chip
              ? t(`subscriptions.status.${chip}`, { defaultValue: chip })
              : t('subscriptions.allStatuses');
            return (
              <button
                key={chip || 'all'}
                type="button"
                className={`admin-subs__chip${active ? ' admin-subs__chip--active' : ''}`}
                aria-pressed={active}
                onClick={() => setStatusFilter(chip)}
              >
                {label}
              </button>
            );
          })}
          <label className="admin-subs__more">
            <span className="admin-subs__sr-only">{t('subscriptions.moreStatuses')}</span>
            <select
              className="admin-select"
              value={moreSelected ? status : ''}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t('subscriptions.moreStatuses')}</option>
              {STATUS_MORE.map((s) => (
                <option key={s} value={s}>
                  {t(`subscriptions.status.${s}`, { defaultValue: s })}
                </option>
              ))}
            </select>
          </label>
        </div>

        <AdminPanel count={total} countLabel={t('listCount', { count: total })}>
          <div className="admin-subs__list">
            {items.length === 0 ? (
              <div className="admin-empty">{t('subscriptions.empty')}</div>
            ) : (
              <>
                <div className="admin-subs__head" aria-hidden>
                  <span>{t('subscriptions.colMember')}</span>
                  <span>{t('subscriptions.colSubscription')}</span>
                  <span>{t('subscriptions.colActions')}</span>
                </div>
                {items.map((row) => (
                  <article key={row.userId} className="admin-subs__row">
                    <div className="admin-subs__identity">
                      <div className="admin-subs__title-row">
                        <h3 className="admin-subs__name">{row.displayName || '—'}</h3>
                        <span className={statusPillClass(String(row.status))}>
                          {t(`subscriptions.status.${row.status}`, {
                            defaultValue: String(row.status),
                          })}
                        </span>
                      </div>
                      <p className="admin-subs__email">{row.email || '—'}</p>
                      <p className="admin-subs__submeta">
                        {t('role')}: {row.roleCode}
                        {' · '}
                        {t('subscriptions.entitlement')}: {row.entitlementPlan}
                      </p>
                    </div>

                    <dl className="admin-subs__facts">
                      <div className="admin-subs__fact">
                        <dt>{t('subscriptions.plan')}</dt>
                        <dd>{row.planCode ?? 'FREE'}</dd>
                      </div>
                      <div className="admin-subs__fact">
                        <dt>{t('subscriptions.trial')}</dt>
                        <dd>{trialLabel(t, row)}</dd>
                      </div>
                      <div className="admin-subs__fact">
                        <dt>{t('subscriptions.expire')}</dt>
                        <dd>{formatDate(row.expireAt)}</dd>
                      </div>
                    </dl>

                    <div className="admin-subs__actions">
                      <select
                        className="admin-select"
                        defaultValue=""
                        disabled={busy}
                        aria-label={t('subscriptions.setPlan')}
                        onChange={(e) => {
                          const value = e.target.value as BillingPlanCode | '';
                          e.target.value = '';
                          if (!value) return;
                          const confirmText = requireStepUp();
                          if (!confirmText) return;
                          setMutation.mutate({
                            userId: row.userId,
                            planCode: value,
                            status: value === 'FREE' ? 'CANCELED' : 'ACTIVE',
                            confirmText,
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
                        onClick={() => {
                          const confirmText = requireStepUp();
                          if (!confirmText) return;
                          extendMutation.mutate({ userId: row.userId, days: 30, confirmText });
                        }}
                      >
                        {t('subscriptions.extend30')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm admin-subs__end"
                        disabled={busy}
                        onClick={() => {
                          const confirmText = requireStepUp();
                          if (!confirmText) return;
                          if (window.confirm(t('subscriptions.endConfirm'))) {
                            endMutation.mutate({ userId: row.userId, confirmText });
                          }
                        }}
                      >
                        {t('subscriptions.end')}
                      </button>
                    </div>
                  </article>
                ))}
              </>
            )}
          </div>
        </AdminPanel>

        {totalPages > 1 ? (
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
        ) : null}
      </div>
    </AdminPageShell>
  );
}
