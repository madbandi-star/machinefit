import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { dataRetentionApi } from '@/api/data-retention.api';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';
import '@/styles/admin-data-retention.css';

type ResultFilter = 'all' | 'ok' | 'fail';

export function AdminDataRetentionLogsPage() {
  const { t } = useTranslation('admin');
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['admin-retention-deletion-logs'],
    queryFn: async () => (await dataRetentionApi.listDeletionLogs(150)).data.data,
  });

  const items = query.data ?? [];

  const stats = useMemo(() => {
    const ok = items.filter((x) => x.success).length;
    const fail = items.length - ok;
    return { total: items.length, ok, fail };
  }, [items]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items
      .filter((log) => {
        if (resultFilter === 'ok' && !log.success) return false;
        if (resultFilter === 'fail' && log.success) return false;
        if (!needle) return true;
        const hay = [
          log.policyCode ?? '',
          log.action,
          log.errorMessage ?? '',
          String(log.rowsAffected),
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => {
        if (a.success !== b.success) return a.success ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [items, search, resultFilter]);

  return (
    <AdminPageShell
      title={t('dataRetention.logsTitle')}
      subtitle={t('dataRetention.logsSubtitle')}
    >
      <div className="ag">
        {query.isLoading ? <Skeleton count={1} height={72} /> : null}
        {!query.isLoading ? (
          <section className="ag-kpis ag-kpis--4" aria-label={t('dataRetention.logsList')}>
            <button
              type="button"
              className={`ag-kpi${resultFilter === 'all' ? ' is-active' : ''}`}
              onClick={() => setResultFilter('all')}
            >
              <span className="ag-kpi__value">{stats.total}</span>
              <span className="ag-kpi__label">{t('dataRetention.statTotal')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${resultFilter === 'ok' ? ' is-active' : ''}`}
              onClick={() => setResultFilter('ok')}
            >
              <span className="ag-kpi__value">{stats.ok}</span>
              <span className="ag-kpi__label">{t('dataRetention.logOk')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${resultFilter === 'fail' ? ' is-active' : ''}${
                stats.fail > 0 ? ' is-danger' : ''
              }`}
              onClick={() => setResultFilter('fail')}
            >
              <span className="ag-kpi__value">{stats.fail}</span>
              <span className="ag-kpi__label">{t('dataRetention.filterFail')}</span>
            </button>
          </section>
        ) : null}

        <section className="ag-panel">
          <div className="ag-toolbar">
            <input
              className="ag-search"
              type="search"
              value={search}
              placeholder={t('dataRetention.logsSearch')}
              aria-label={t('dataRetention.logsSearch')}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                  const open = expandedId === log.id;
                  return (
                    <article
                      key={log.id}
                      className={[
                        'ag-card',
                        log.success ? 'is-on' : 'is-fail',
                        open ? 'is-selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <button
                        type="button"
                        className="ag-card__main"
                        onClick={() =>
                          setExpandedId((prev) => (prev === log.id ? null : log.id))
                        }
                      >
                        <span className="ag-card__identity">
                          <span className="ag-card__title">{log.policyCode ?? '—'}</span>
                          <span className="ag-card__meta">
                            {new Date(log.createdAt).toLocaleString()}
                            {' · '}
                            {log.action}
                            {' · '}
                            {t('dataRetention.logRows')}: {log.rowsAffected}
                          </span>
                        </span>
                        <span
                          className={`ag-pill ${log.success ? 'ag-pill--on' : 'ag-pill--danger'}`}
                        >
                          {log.success
                            ? t('dataRetention.logOk')
                            : t('dataRetention.logFail')}
                        </span>
                        <span className="ag-card__chevron" aria-hidden>
                          {open ? '▾' : '▸'}
                        </span>
                      </button>
                      {open ? (
                        <div className="ag-card__detail">
                          <p className="ag-card__excerpt">
                            {t('dataRetention.logAction')}: {log.action}
                            {' · '}
                            {t('dataRetention.logRows')}: {log.rowsAffected}
                          </p>
                          {log.errorMessage ? (
                            <p className="ag-card__excerpt">
                              {t('dataRetention.logError')}: {log.errorMessage}
                            </p>
                          ) : (
                            <p className="ag-card__excerpt">{t('dataRetention.logNoError')}</p>
                          )}
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
