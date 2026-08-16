import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ADMIN_BILLING_STEP_UP_CONFIRM,
  type BillingPlanCode,
  type SubscriptionStatus,
} from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { ScrollCarousel } from '@/components/navigation/ScrollCarousel/ScrollCarousel';
import { adminBillingApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';

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
  if (s === 'ACTIVE') return 'ag-pill ag-pill--on';
  if (s === 'TRIAL') return 'ag-pill ag-pill--warn';
  if (s === 'FAILED') return 'ag-pill ag-pill--danger';
  if (s === 'PENDING' || s === 'PAUSED') return 'ag-pill ag-pill--warn';
  if (s === 'EXPIRED' || s === 'CANCELED' || s === 'CANCELLED' || s === 'NONE') {
    return 'ag-pill ag-pill--off';
  }
  return 'ag-pill ag-pill--off';
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
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [stepUpText, setStepUpText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const items = data?.items ?? [];
  const total = data?.meta.total ?? items.length;
  const totalPages = data?.meta.totalPages ?? 1;
  const currentPage = data?.meta.page ?? page;
  const busy =
    extendMutation.isPending || endMutation.isPending || setMutation.isPending;
  const moreSelected = STATUS_MORE.includes(status as (typeof STATUS_MORE)[number]);

  const pageStats = useMemo(() => {
    let active = 0;
    let trial = 0;
    let expired = 0;
    for (const row of items) {
      const s = String(row.status).toUpperCase();
      if (s === 'ACTIVE') active += 1;
      else if (s === 'TRIAL') trial += 1;
      else if (s === 'EXPIRED') expired += 1;
    }
    return { active, trial, expired };
  }, [items]);

  const setStatusFilter = (next: string) => {
    setPage(1);
    setStatus(next);
    setExpandedId(null);
  };

  if (isLoading && !data) {
    return (
      <AdminPageShell title={t('subscriptions.nav')} subtitle={t('subscriptions.desc')}>
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title={t('subscriptions.nav')} subtitle={t('subscriptions.desc')}>
      <div className="ag">
        <div className="ag-banner" role="group" aria-label={t('subscriptions.stepUpLabel')}>
          <p style={{ margin: '0 0 0.45rem' }}>{t('subscriptions.stepUpHint')}</p>
          <label className="ag-field ag-field--full">
            <span>{t('subscriptions.stepUpLabel')}</span>
            <input
              className="input"
              value={stepUpText}
              onChange={(e) => setStepUpText(e.target.value)}
              placeholder={t('subscriptions.stepUpPlaceholder')}
              autoComplete="off"
            />
          </label>
        </div>

        <section className="ag-kpis ag-kpis--4" aria-label={t('subscriptions.stats')}>
          <button
            type="button"
            className={`ag-kpi${status === '' ? ' is-active' : ''}`}
            onClick={() => setStatusFilter('')}
          >
            <span className="ag-kpi__value">{total}</span>
            <span className="ag-kpi__label">{t('subscriptions.statTotal')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${status === 'ACTIVE' ? ' is-active' : ''}`}
            onClick={() => setStatusFilter('ACTIVE')}
          >
            <span className="ag-kpi__value">{pageStats.active}</span>
            <span className="ag-kpi__label">{t('subscriptions.statActivePage')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${status === 'TRIAL' ? ' is-active' : ''}`}
            onClick={() => setStatusFilter('TRIAL')}
          >
            <span className="ag-kpi__value">{pageStats.trial}</span>
            <span className="ag-kpi__label">{t('subscriptions.statTrialPage')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${status === 'EXPIRED' ? ' is-active' : ''}${
              pageStats.expired > 0 ? ' is-muted' : ''
            }`}
            onClick={() => setStatusFilter('EXPIRED')}
          >
            <span className="ag-kpi__value">{pageStats.expired}</span>
            <span className="ag-kpi__label">{t('subscriptions.statExpiredPage')}</span>
          </button>
        </section>

        <section className="ag-panel">
          <div className="ag-toolbar">
            <input
              className="ag-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
                setExpandedId(null);
              }}
              placeholder={t('subscriptions.searchPlaceholder')}
              aria-label={t('subscriptions.searchPlaceholder')}
            />
            <ScrollCarousel
              className="chip-carousel"
              scrollerClassName="ag-chips"
              scrollerProps={{ role: 'group', 'aria-label': t('subscriptions.allStatuses') }}
            >
              {STATUS_CHIPS.map((chip) => {
                const active = status === chip;
                const label = chip
                  ? t(`subscriptions.status.${chip}`, { defaultValue: chip })
                  : t('subscriptions.allStatuses');
                return (
                  <button
                    key={chip || 'all'}
                    type="button"
                    className={`ag-chip${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => setStatusFilter(chip)}
                  >
                    {label}
                  </button>
                );
              })}
              <label className="ag-field" style={{ margin: 0 }}>
                <span className="visually-hidden">{t('subscriptions.moreStatuses')}</span>
                <select
                  className="input"
                  value={moreSelected ? status : ''}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ minHeight: '2rem', padding: '0.35rem 0.55rem', fontSize: '0.74rem' }}
                >
                  <option value="">{t('subscriptions.moreStatuses')}</option>
                  {STATUS_MORE.map((s) => (
                    <option key={s} value={s}>
                      {t(`subscriptions.status.${s}`, { defaultValue: s })}
                    </option>
                  ))}
                </select>
              </label>
            </ScrollCarousel>
          </div>

          {items.length === 0 ? (
            <p className="ag-empty">{t('subscriptions.empty')}</p>
          ) : (
            <div className="ag-queue">
              {items.map((row) => {
                const open = expandedId === row.userId;
                return (
                  <article
                    key={row.userId}
                    className={['ag-card', open ? 'is-selected' : ''].filter(Boolean).join(' ')}
                  >
                    <button
                      type="button"
                      className="ag-card__main"
                      onClick={() =>
                        setExpandedId((prev) => (prev === row.userId ? null : row.userId))
                      }
                    >
                      <span className="ag-card__identity">
                        <span className="ag-card__title">{row.displayName || '—'}</span>
                        <span className="ag-card__meta">
                          {row.email || row.userId.slice(0, 8)}
                          {' · '}
                          {row.planCode ?? 'FREE'}
                          {' · '}
                          {formatDate(row.expireAt)}
                        </span>
                      </span>
                      <span className={statusPillClass(String(row.status))}>
                        {t(`subscriptions.status.${row.status}`, {
                          defaultValue: String(row.status),
                        })}
                      </span>
                      <span className="ag-card__chevron" aria-hidden>
                        {open ? '▾' : '▸'}
                      </span>
                    </button>
                    {open ? (
                      <div className="ag-card__detail">
                        <p className="ag-card__excerpt">
                          {t('role')}: {row.roleCode}
                          {' · '}
                          {t('subscriptions.entitlement')}: {row.entitlementPlan}
                          {' · '}
                          {t('subscriptions.trial')}: {trialLabel(t, row)}
                        </p>
                        <div className="ag-card__actions">
                          <select
                            className="input"
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
                              extendMutation.mutate({
                                userId: row.userId,
                                days: 30,
                                confirmText,
                              });
                            }}
                          >
                            {t('subscriptions.extend30')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
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
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}

          {totalPages > 1 ? (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(next) => {
                setPage(next);
                setExpandedId(null);
              }}
            />
          ) : null}
        </section>
      </div>
    </AdminPageShell>
  );
}
