import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { dataRetentionApi } from '@/api/data-retention.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-data-retention.css';

function ddayLabel(days: number, t: (k: string, o?: Record<string, unknown>) => string) {
  if (days < 0) return t('dataRetention.ddayOverdue', { n: Math.abs(days) });
  if (days === 0) return t('dataRetention.ddayToday');
  return t('dataRetention.dday', { n: days });
}

function ddayPillClass(days: number): string {
  if (days < 0) return 'admin-status-pill is-danger';
  if (days <= 7) return 'admin-status-pill is-pending';
  return 'admin-status-pill is-active';
}

const WINDOWS = [
  ['today', 'dataRetention.windowToday'],
  ['7d', 'dataRetention.window7'],
  ['30d', 'dataRetention.window30'],
  ['90d', 'dataRetention.window90'],
  ['all', 'dataRetention.windowAll'],
] as const;

export function AdminDataRetentionScheduledPage() {
  const { t } = useTranslation('admin');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [window, setWindow] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('30d');
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
      queryClient.invalidateQueries({ queryKey: ['admin-retention-scheduled'] });
      queryClient.invalidateQueries({ queryKey: ['admin-retention-summary'] });
    },
    onError: () => showToast(t('error'), 'error'),
  });

  if (query.isLoading) {
    return (
      <AdminPageShell
        title={t('dataRetention.scheduledTitle')}
        subtitle={t('dataRetention.scheduledSubtitle')}
      >
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  const items = query.data?.items ?? [];

  return (
    <AdminPageShell
      title={t('dataRetention.scheduledTitle')}
      subtitle={t('dataRetention.scheduledSubtitle')}
    >
      <div className="admin-retention">
        <AdminPanel
          title={t('dataRetention.scheduledList')}
          count={query.data?.total ?? items.length}
          countLabel={t('dataRetention.totalCount', { n: query.data?.total ?? 0 })}
        >
          <div className="admin-retention__chips" role="group" aria-label={t('dataRetention.window')}>
            {WINDOWS.map(([value, labelKey]) => (
              <button
                key={value}
                type="button"
                className={`admin-retention__chip${window === value ? ' admin-retention__chip--active' : ''}`}
                aria-pressed={window === value}
                onClick={() => setWindow(value)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          {items.length === 0 ? (
            <div className="admin-empty">{t('dataRetention.emptyScheduled')}</div>
          ) : (
            <div className="admin-retention__list">
              {items.map((r) => (
                <article key={r.id} className="admin-retention__row admin-retention__row--static">
                  <div className="admin-retention__main">
                    <div className="admin-retention__title-row">
                      <h3 className="admin-retention__name">{r.policyName}</h3>
                      {r.hold ? (
                        <span className="admin-status-pill is-pending">
                          {t('dataRetention.onHold')}
                        </span>
                      ) : (
                        <span className="admin-status-pill is-verified">{r.status}</span>
                      )}
                    </div>
                    <p className="admin-retention__code">{r.policyCode}</p>
                    <p className="admin-retention__sub">
                      {t('dataRetention.subject')}:{' '}
                      {r.userDisplayName ?? r.subjectId.slice(0, 8)}
                    </p>
                  </div>
                  <dl className="admin-retention__facts">
                    <div className="admin-retention__fact">
                      <dt>{t('dataRetention.scheduledAt')}</dt>
                      <dd>{r.scheduledDeletionAt.slice(0, 10)}</dd>
                    </div>
                    <div className="admin-retention__fact">
                      <dt>{t('dataRetention.colSampleDday')}</dt>
                      <dd>
                        <span className={ddayPillClass(r.daysRemaining)}>
                          {ddayLabel(r.daysRemaining, t)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                  <div className="admin-retention__actions">
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
                        onClick={() => setHoldId(r.id)}
                      >
                        {t('dataRetention.setHold')}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {holdId ? (
            <div className="admin-retention__hold">
              <h3 className="admin-retention__hold-title">{t('dataRetention.setHold')}</h3>
              <label className="admin-form-card">
                <span className="admin-form-card__label">{t('dataRetention.holdReason')}</span>
                <input
                  className="input"
                  type="text"
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                />
              </label>
              <label className="admin-form-card">
                <span className="admin-form-card__label">{t('dataRetention.holdUntil')}</span>
                <input
                  className="input"
                  type="datetime-local"
                  value={holdUntil}
                  onChange={(e) => setHoldUntil(e.target.value)}
                />
              </label>
              <div className="admin-retention__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  disabled={!holdReason.trim() || !holdUntil || holdMutation.isPending}
                  onClick={() =>
                    holdMutation.mutate({
                      id: holdId,
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
                  className="btn btn--secondary btn--sm"
                  onClick={() => setHoldId(null)}
                >
                  {t('dataRetention.cancel')}
                </button>
              </div>
            </div>
          ) : null}
        </AdminPanel>
      </div>
    </AdminPageShell>
  );
}
