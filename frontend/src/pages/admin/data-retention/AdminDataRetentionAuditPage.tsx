import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import '@/styles/admin.css';
import '@/styles/admin-data-retention.css';

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
      <div className="admin-retention">
        <AdminPanel
          title={t('dataRetention.auditList')}
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
                      <h3 className="admin-retention__name">{log.action}</h3>
                    </div>
                    <p className="admin-retention__sub">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <dl className="admin-retention__facts">
                    <div className="admin-retention__fact">
                      <dt>{t('dataRetention.actor')}</dt>
                      <dd>{log.actorId ? String(log.actorId).slice(0, 8) : '—'}</dd>
                    </div>
                    <div className="admin-retention__fact">
                      <dt>{t('dataRetention.target')}</dt>
                      <dd>{log.targetId ? String(log.targetId).slice(0, 8) : '—'}</dd>
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
