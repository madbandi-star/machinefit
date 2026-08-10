import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { dataRetentionApi } from '@/api/data-retention.api';
import '@/styles/admin.css';

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
      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('dataRetention.logTime')}</th>
                <th>{t('dataRetention.logAction')}</th>
                <th>{t('dataRetention.colName')}</th>
                <th>{t('dataRetention.logResult')}</th>
                <th>{t('dataRetention.logRows')}</th>
                <th>{t('dataRetention.logError')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.action}</td>
                  <td>{log.policyCode ?? '—'}</td>
                  <td>{log.success ? 'OK' : 'FAIL'}</td>
                  <td>{log.rowsAffected}</td>
                  <td>{log.errorMessage ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="admin-muted">{t('dataRetention.emptyLogs')}</p>}
        </div>
      </section>
    </AdminPageShell>
  );
}
