import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import '@/styles/admin.css';

export function AdminDataRetentionAuditPage() {
  const { t } = useTranslation('admin');
  const query = useQuery({
    queryKey: ['admin-retention-audit-logs'],
    queryFn: async () => (await complianceApi.adminAuditLogs(200)).data.data,
  });

  const items = useMemo(
    () => (query.data ?? []).filter((row) => String(row.action ?? '').startsWith('retention.')),
    [query.data]
  );

  if (query.isLoading) {
    return (
      <AdminPageShell
        title={t('dataRetention.auditTitle')}
        subtitle={t('dataRetention.auditSubtitle')}
      >
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title={t('dataRetention.auditTitle')}
      subtitle={t('dataRetention.auditSubtitle')}
    >
      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('dataRetention.logTime')}</th>
                <th>{t('dataRetention.logAction')}</th>
                <th>{t('dataRetention.actor')}</th>
                <th>{t('dataRetention.target')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.action}</td>
                  <td>{log.actorId ? String(log.actorId).slice(0, 8) : '—'}</td>
                  <td>{log.targetId ? String(log.targetId).slice(0, 8) : '—'}</td>
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
