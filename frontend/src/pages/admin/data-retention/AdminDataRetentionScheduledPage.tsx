import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { dataRetentionApi } from '@/api/data-retention.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';
import '@/styles/admin-data-retention.css';

type WindowKey = 'today' | '7d' | '30d' | '90d' | 'all';
type StatusFilter = 'inWindow' | 'overdue' | 'dueToday' | 'onHold';

function ddayLabel(days: number, t: (k: string, o?: Record<string, unknown>) => string) {
  if (days < 0) return t('dataRetention.ddayOverdue', { n: Math.abs(days) });
  if (days === 0) return t('dataRetention.ddayToday');
  return t('dataRetention.dday', { n: days });
}

function ddayPillClass(days: number): string {
  if (days < 0) return 'ag-pill ag-pill--danger';
  if (days <= 7) return 'ag-pill ag-pill--warn';
  return 'ag-pill ag-pill--on';
}

const WINDOWS: { value: WindowKey; labelKey: string }[] = [
  { value: 'today', labelKey: 'dataRetention.windowToday' },
  { value: '7d', labelKey: 'dataRetention.window7' },
  { value: '30d', labelKey: 'dataRetention.window30' },
  { value: '90d', labelKey: 'dataRetention.window90' },
  { value: 'all', labelKey: 'dataRetention.windowAll' },
];

export function AdminDataRetentionScheduledPage() {
  const { t } = useTranslation('admin');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [window, setWindow] = useState<WindowKey>('30d');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('inWindow');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdReason, setHoldReason] = useState('');
  const [holdUntil, setHoldUntil] = useState('');

  const query = useQuery({
    queryKey: ['admin-retention-scheduled', window],
    queryFn: async () =>
      (await dataRetentionApi.listScheduled({ window, limit: 100 })).data.data,
  });

  const holdMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      hold: boolean;
      holdReason: string;
      holdUntil?: string | null;
    }) =>
      dataRetentionApi.setHold(payload.id, {
        hold: payload.hold,
        holdReason: payload.holdReason,
        holdUntil: payload.holdUntil,
      }),
    onSuccess: () => {
      showToast(t('saved'), 'success');
      setHoldId(null);
      setHoldReason('');
      setHoldUntil('');
      setExpandedId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-retention-scheduled'] });
      queryClient.invalidateQueries({ queryKey: ['admin-retention-summary'] });
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const items = query.data?.items ?? [];

  const derived = useMemo(() => {
    const overdue = items.filter((r) => r.daysRemaining < 0).length;
    const dueToday = items.filter((r) => r.daysRemaining === 0).length;
    const onHold = items.filter((r) => r.hold).length;
    return {
      inWindow: items.length,
      overdue,
      dueToday,
      onHold,
    };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (statusFilter === 'overdue') return r.daysRemaining < 0;
      if (statusFilter === 'dueToday') return r.daysRemaining === 0;
      if (statusFilter === 'onHold') return r.hold;
      return true;
    });
  }, [items, statusFilter]);

  const openHold = (id: string) => {
    setExpandedId(id);
    setHoldId(id);
    setHoldReason('');
    setHoldUntil('');
  };

  const cancelHold = () => {
    setHoldId(null);
    setHoldReason('');
    setHoldUntil('');
  };

  return (
    <AdminPageShell
      title={t('dataRetention.scheduledTitle')}
      subtitle={t('dataRetention.scheduledSubtitle')}
    >
      <div className="ag">
        {query.isLoading ? <Skeleton count={1} height={72} /> : null}
        {!query.isLoading ? (
          <section className="ag-kpis ag-kpis--4" aria-label={t('dataRetention.scheduledList')}>
            <button
              type="button"
              className={`ag-kpi${statusFilter === 'inWindow' ? ' is-active' : ''}`}
              onClick={() => setStatusFilter('inWindow')}
            >
              <span className="ag-kpi__value">{derived.inWindow}</span>
              <span className="ag-kpi__label">{t('dataRetention.kpiInWindow')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${statusFilter === 'overdue' ? ' is-active' : ''}${
                derived.overdue > 0 ? ' is-danger' : ''
              }`}
              onClick={() => setStatusFilter('overdue')}
            >
              <span className="ag-kpi__value">{derived.overdue}</span>
              <span className="ag-kpi__label">{t('dataRetention.kpiOverdue')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${statusFilter === 'dueToday' ? ' is-active' : ''}${
                derived.dueToday > 0 ? ' is-warn' : ''
              }`}
              onClick={() => setStatusFilter('dueToday')}
            >
              <span className="ag-kpi__value">{derived.dueToday}</span>
              <span className="ag-kpi__label">{t('dataRetention.kpiDueToday')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${statusFilter === 'onHold' ? ' is-active' : ''}${
                derived.onHold > 0 ? ' is-warn' : ''
              }`}
              onClick={() => setStatusFilter('onHold')}
            >
              <span className="ag-kpi__value">{derived.onHold}</span>
              <span className="ag-kpi__label">{t('dataRetention.kpiHold')}</span>
            </button>
          </section>
        ) : null}

        <section className="ag-panel">
          <div className="ag-toolbar">
            <div className="ag-chips" role="group" aria-label={t('dataRetention.window')}>
              {WINDOWS.map(({ value, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  className={`ag-chip${window === value ? ' is-active' : ''}`}
                  onClick={() => setWindow(value)}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="ag-main">
            {query.isError ? (
              <QueryErrorMessage onRetry={() => void query.refetch()} />
            ) : null}
            {query.isLoading ? <Skeleton count={5} height={52} /> : null}
            {!query.isLoading && !query.isError && filtered.length === 0 ? (
              <p className="ag-empty">{t('dataRetention.emptyScheduled')}</p>
            ) : null}
            {!query.isLoading && filtered.length > 0 ? (
              <div className="ag-queue">
                {filtered.map((r) => {
                  const open = expandedId === r.id;
                  const holding = holdId === r.id;
                  return (
                    <article
                      key={r.id}
                      className={[
                        'ag-card',
                        r.hold ? 'is-warn' : '',
                        r.daysRemaining < 0 ? 'is-fail' : '',
                        open ? 'is-selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <button
                        type="button"
                        className="ag-card__main"
                        onClick={() =>
                          setExpandedId((prev) => {
                            if (prev === r.id) {
                              if (holdId === r.id) cancelHold();
                              return null;
                            }
                            return r.id;
                          })
                        }
                      >
                        <span className="ag-card__identity">
                          <span className="ag-card__title">{r.policyName}</span>
                          <span className="ag-card__meta">
                            {r.policyCode}
                            {' · '}
                            {t('dataRetention.subject')}:{' '}
                            {r.userDisplayName ?? r.subjectId.slice(0, 8)}
                            {' · '}
                            {r.scheduledDeletionAt.slice(0, 10)}
                          </span>
                        </span>
                        <span className={ddayPillClass(r.daysRemaining)}>
                          {ddayLabel(r.daysRemaining, t)}
                        </span>
                        <span
                          className={`ag-pill ${r.hold ? 'ag-pill--warn' : 'ag-pill--on'}`}
                        >
                          {r.hold ? t('dataRetention.onHold') : r.status}
                        </span>
                        <span className="ag-card__chevron" aria-hidden>
                          {open ? '▾' : '▸'}
                        </span>
                      </button>

                      {open ? (
                        <div className="ag-card__detail">
                          <div className="ag-card__actions">
                            {r.hold ? (
                              <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                disabled={holdMutation.isPending}
                                onClick={() =>
                                  holdMutation.mutate({
                                    id: r.id,
                                    hold: false,
                                    holdReason: 'release',
                                  })
                                }
                              >
                                {t('dataRetention.releaseHold')}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                onClick={() => openHold(r.id)}
                              >
                                {t('dataRetention.setHold')}
                              </button>
                            )}
                          </div>

                          {holding ? (
                            <div className="adr-hold-form">
                              <label className="ag-field">
                                <span>{t('dataRetention.holdReason')}</span>
                                <input
                                  className="input"
                                  type="text"
                                  value={holdReason}
                                  onChange={(e) => setHoldReason(e.target.value)}
                                />
                              </label>
                              <label className="ag-field">
                                <span>{t('dataRetention.holdUntil')}</span>
                                <input
                                  className="input"
                                  type="datetime-local"
                                  value={holdUntil}
                                  onChange={(e) => setHoldUntil(e.target.value)}
                                />
                              </label>
                              <div className="ag-card__actions">
                                <button
                                  type="button"
                                  className="btn btn--primary btn--sm"
                                  disabled={
                                    !holdReason.trim() || !holdUntil || holdMutation.isPending
                                  }
                                  onClick={() =>
                                    holdMutation.mutate({
                                      id: r.id,
                                      hold: true,
                                      holdReason,
                                      holdUntil: new Date(holdUntil).toISOString(),
                                    })
                                  }
                                >
                                  {t('dataRetention.confirmHold')}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={cancelHold}
                                >
                                  {t('dataRetention.cancel')}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
