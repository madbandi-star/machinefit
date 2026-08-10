import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { dataRetentionApi } from '@/api/data-retention.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';

function ddayLabel(days: number, t: (k: string, o?: Record<string, unknown>) => string) {
  if (days < 0) return t('dataRetention.ddayOverdue', { n: Math.abs(days) });
  if (days === 0) return t('dataRetention.ddayToday');
  return t('dataRetention.dday', { n: days });
}

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
      <section className="admin-panel">
        <div className="admin-filters">
          {(
            [
              ['today', 'dataRetention.windowToday'],
              ['7d', 'dataRetention.window7'],
              ['30d', 'dataRetention.window30'],
              ['90d', 'dataRetention.window90'],
              ['all', 'dataRetention.windowAll'],
            ] as const
          ).map(([value, labelKey]) => (
            <button
              key={value}
              type="button"
              className={`btn ${window === value ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setWindow(value)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
        <p className="admin-muted">
          {t('dataRetention.totalCount', { n: query.data?.total ?? 0 })}
        </p>

        <div className="admin-table-wrap admin-table-wrap--desktop">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('dataRetention.colName')}</th>
                <th>{t('dataRetention.subject')}</th>
                <th>{t('dataRetention.scheduledAt')}</th>
                <th>{t('dataRetention.colSampleDday')}</th>
                <th>{t('dataRetention.status')}</th>
                <th>{t('dataRetention.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.policyName}</strong>
                    <div className="admin-muted">{r.policyCode}</div>
                  </td>
                  <td>{r.userDisplayName ?? r.subjectId.slice(0, 8)}</td>
                  <td>{r.scheduledDeletionAt.slice(0, 10)}</td>
                  <td>{ddayLabel(r.daysRemaining, t)}</td>
                  <td>
                    {r.status}
                    {r.hold ? ` · ${t('dataRetention.onHold')}` : ''}
                  </td>
                  <td>
                    {r.hold ? (
                      <button
                        type="button"
                        className="btn btn--secondary"
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
                        className="btn btn--secondary"
                        onClick={() => setHoldId(r.id)}
                      >
                        {t('dataRetention.setHold')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-card-list admin-card-list--mobile">
          {items.map((r) => (
            <div key={r.id} className="admin-card">
              <strong>{r.policyName}</strong>
              <div>
                {r.scheduledDeletionAt.slice(0, 10)} · {ddayLabel(r.daysRemaining, t)}
              </div>
              <div>
                {r.status}
                {r.hold ? ` · ${t('dataRetention.onHold')}` : ''}
              </div>
            </div>
          ))}
        </div>

        {holdId && (
          <div className="admin-panel" style={{ marginTop: 16 }}>
            <h3 className="admin-panel__title">{t('dataRetention.setHold')}</h3>
            <input
              type="text"
              placeholder={t('dataRetention.holdReason')}
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
            />
            <input
              type="datetime-local"
              value={holdUntil}
              onChange={(e) => setHoldUntil(e.target.value)}
            />
            <div className="admin-row__actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={!holdReason.trim() || !holdUntil}
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
                className="btn btn--secondary"
                onClick={() => setHoldId(null)}
              >
                {t('dataRetention.cancel')}
              </button>
            </div>
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
