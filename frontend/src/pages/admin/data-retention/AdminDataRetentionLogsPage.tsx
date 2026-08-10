import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { dataRetentionApi } from '@/api/data-retention.api';
import '@/styles/admin.css';
import '@/styles/admin-data-retention.css';

export function AdminDataRetentionLogsPage() {
  const { t } = useTranslation('admin');
  const query = useQuery({
    queryKey: ['admin-retention-deletion-logs'],
    queryFn: async () => (await dataRetentionApi.listDeletionLogs(150)).data.data,
  });

  if (query.isLoading) {
    return (
      <AdminPageShell
        title={t('dataRetention.logsTitle')}
        subtitle={t('dataRetention.logsSubtitle')}
      >
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  const items = query.data ?? [];

  return (
    <AdminPageShell
      title={t('dataRetention.logsTitle')}
      subtitle={t('dataRetention.logsSubtitle')}
    >
      <div className="admin-retention">
        <AdminPanel
          title={t('dataRetention.logsList')}
          count={items.length}
          countLabel={t('listCount', { count: items.length })}
        >
          {items.length === 0 ? (
            <div className="admin-empty">{t('dataRetention.emptyLogs')}</div>
          ) : (
            <div className="admin-retention__list">
              {items.map((log) => (
                <article key={log.id} className="admin-retention__row admin-retention__row--static">
                  <div className="admin-retention__main">
                    <div className="admin-retention__title-row">
                      <h3 className="admin-retention__name">{log.policyCode ?? '—'}</h3>
                      <span
                        className={`admin-status-pill${log.success ? ' is-active' : ' is-danger'}`}
                      >
                        {log.success
                          ? t('dataRetention.logOk')
                          : t('dataRetention.logFail')}
                      </span>
                    </div>
                    <p className="admin-retention__sub">
                      {new Date(log.createdAt).toLocaleString()} · {log.action}
                    </p>
                    {log.errorMessage ? (
                      <p className="admin-retention__sub">{log.errorMessage}</p>
                    ) : null}
                  </div>
                  <dl className="admin-retention__facts">
                    <div className="admin-retention__fact">
                      <dt>{t('dataRetention.logRows')}</dt>
                      <dd>{log.rowsAffected}</dd>
                    </div>
                    <div className="admin-retention__fact">
                      <dt>{t('dataRetention.logResult')}</dt>
                      <dd>
                        {log.success
                          ? t('dataRetention.logOk')
                          : t('dataRetention.logFail')}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </AdminPanel>
      </div>
    </AdminPageShell>
  );
}
