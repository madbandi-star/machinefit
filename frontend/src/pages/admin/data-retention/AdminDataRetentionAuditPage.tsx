import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';
import '@/styles/admin-data-retention.css';

type ActionBucket = 'all' | 'policy' | 'record' | 'consent' | 'other';

function actionBucket(action: string): Exclude<ActionBucket, 'all'> {
  if (action.startsWith('retention.policy')) return 'policy';
  if (action.startsWith('retention.record')) return 'record';
  if (action.startsWith('retention.consent')) return 'consent';
  return 'other';
}

function humanizeAction(
  action: string,
  t: (k: string, o?: Record<string, unknown>) => string
): string {
  const map: Record<string, string> = {
    'retention.policy.create': 'dataRetention.action.policyCreate',
    'retention.policy.update': 'dataRetention.action.policyUpdate',
    'retention.consent.create': 'dataRetention.action.consentCreate',
    'retention.record.hold': 'dataRetention.action.recordHold',
    'retention.record.hold_release': 'dataRetention.action.recordHoldRelease',
  };
  const key = map[action];
  if (key) return t(key);
  if (action.startsWith('retention.')) {
    return t('dataRetention.action.generic', { action: action.replace(/^retention\./, '') });
  }
  return action;
}

export function AdminDataRetentionAuditPage() {
  const { t } = useTranslation('admin');
  const [search, setSearch] = useState('');
  const [bucket, setBucket] = useState<ActionBucket>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin-retention-audit-logs'],
    queryFn: async () => (await complianceApi.adminAuditLogs(200)).data.data,
  });

  const items = useMemo(
    () => (query.data ?? []).filter((row) => String(row.action ?? '').startsWith('retention.')),
    [query.data]
  );

  const bucketCounts = useMemo(() => {
    const counts: Record<Exclude<ActionBucket, 'all'>, number> = {
      policy: 0,
      record: 0,
      consent: 0,
      other: 0,
    };
    for (const row of items) {
      counts[actionBucket(String(row.action ?? ''))] += 1;
    }
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((row) => {
      const action = String(row.action ?? '');
      if (bucket !== 'all' && actionBucket(action) !== bucket) return false;
      if (!needle) return true;
      const label = humanizeAction(action, t).toLowerCase();
      const hay = [
        action,
        label,
        row.actorId ? String(row.actorId) : '',
        row.targetId ? String(row.targetId) : '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [items, bucket, search, t]);

  return (
    <AdminPageShell
      title={t('dataRetention.auditTitle')}
      subtitle={t('dataRetention.auditSubtitle')}
    >
      <div className="ag">
        {query.isLoading ? <Skeleton count={1} height={72} /> : null}
        {!query.isLoading ? (
          <section className="ag-kpis" aria-label={t('dataRetention.auditList')}>
            <button
              type="button"
              className={`ag-kpi${bucket === 'all' ? ' is-active' : ''}`}
              onClick={() => setBucket('all')}
            >
              <span className="ag-kpi__value">{items.length}</span>
              <span className="ag-kpi__label">{t('dataRetention.statTotal')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${bucket === 'policy' ? ' is-active' : ''}`}
              onClick={() => setBucket('policy')}
            >
              <span className="ag-kpi__value">{bucketCounts.policy}</span>
              <span className="ag-kpi__label">{t('dataRetention.bucketPolicy')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${bucket === 'record' ? ' is-active' : ''}`}
              onClick={() => setBucket('record')}
            >
              <span className="ag-kpi__value">{bucketCounts.record}</span>
              <span className="ag-kpi__label">{t('dataRetention.bucketRecord')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${bucket === 'consent' ? ' is-active' : ''}`}
              onClick={() => setBucket('consent')}
            >
              <span className="ag-kpi__value">{bucketCounts.consent}</span>
              <span className="ag-kpi__label">{t('dataRetention.bucketConsent')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${bucket === 'other' ? ' is-active' : ''}`}
              onClick={() => setBucket('other')}
            >
              <span className="ag-kpi__value">{bucketCounts.other}</span>
              <span className="ag-kpi__label">{t('dataRetention.bucketOther')}</span>
            </button>
          </section>
        ) : null}

        <section className="ag-panel">
          <div className="ag-toolbar">
            <input
              className="ag-search"
              type="search"
              value={search}
              placeholder={t('dataRetention.auditSearch')}
              aria-label={t('dataRetention.auditSearch')}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="ag-chips" role="group" aria-label={t('dataRetention.logAction')}>
              {(
                [
                  ['all', 'dataRetention.allCategories', items.length],
                  ['policy', 'dataRetention.bucketPolicy', bucketCounts.policy],
                  ['record', 'dataRetention.bucketRecord', bucketCounts.record],
                  ['consent', 'dataRetention.bucketConsent', bucketCounts.consent],
                  ['other', 'dataRetention.bucketOther', bucketCounts.other],
                ] as const
              ).map(([id, labelKey, count]) => (
                <button
                  key={id}
                  type="button"
                  className={`ag-chip${bucket === id ? ' is-active' : ''}`}
                  onClick={() => setBucket(id)}
                >
                  {t(labelKey)}
                  <span className="ag-chip__count">{count}</span>
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
              <p className="ag-empty">{t('dataRetention.emptyLogs')}</p>
            ) : null}
            {!query.isLoading && filtered.length > 0 ? (
              <div className="ag-queue">
                {filtered.map((log) => {
                  const action = String(log.action ?? '');
                  const open = expandedId === log.id;
                  const label = humanizeAction(action, t);
                  return (
                    <article
                      key={log.id}
                      className={`ag-card${open ? ' is-selected' : ''}`}
                    >
                      <button
                        type="button"
                        className="ag-card__main"
                        onClick={() =>
                          setExpandedId((prev) => (prev === log.id ? null : log.id))
                        }
                      >
                        <span className="ag-card__identity">
                          <span className="ag-card__title">{label}</span>
                          <span className="ag-card__meta">
                            {new Date(log.createdAt).toLocaleString()}
                            {' · '}
                            {t('dataRetention.actor')}:{' '}
                            {log.actorId ? String(log.actorId).slice(0, 8) : '—'}
                            {' · '}
                            {t('dataRetention.target')}:{' '}
                            {log.targetId ? String(log.targetId).slice(0, 8) : '—'}
                          </span>
                        </span>
                        <span className="ag-pill ag-pill--off">{actionBucket(action)}</span>
                        <span className="ag-card__chevron" aria-hidden>
                          {open ? '▾' : '▸'}
                        </span>
                      </button>
                      {open ? (
                        <div className="ag-card__detail">
                          <p className="ag-card__excerpt">
                            {t('dataRetention.logAction')}: {action}
                          </p>
                          <p className="ag-card__excerpt">
                            {t('dataRetention.actor')}:{' '}
                            {log.actorId ? String(log.actorId) : '—'}
                            {' · '}
                            {t('dataRetention.target')}:{' '}
                            {log.targetId ? String(log.targetId) : '—'}
                          </p>
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
