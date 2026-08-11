import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminUsageApi } from '@/api/usage.api';
import '@/styles/admin.css';
import '@/styles/admin-usage.css';

function formatLimit(v: unknown, unlimited: string): string {
  if (v === null || v === undefined) return unlimited;
  return String(v);
}

export function AdminUsagePolicyHistoryPage() {
  const { t } = useTranslation('admin');

  const historyQuery = useQuery({
    queryKey: ['admin-usage-policy-history'],
    queryFn: async () => (await adminUsageApi.listHistory({ limit: 50 })).data.data,
  });

  const items =
    historyQuery.data && 'items' in historyQuery.data
      ? historyQuery.data.items
      : [];

  return (
    <AdminPageShell title={t('usage.historyTitle')} subtitle={t('usage.historySubtitle')}>
      <AdminPanel title={t('usage.historyList')}>
        {historyQuery.isLoading ? (
          <Skeleton count={5} />
        ) : items.length === 0 ? (
          <p className="admin-muted">{t('usage.noHistory')}</p>
        ) : (
          <ul className="admin-usage__history-list">
            {items.map((h) => (
              <li key={h.id} className="admin-usage__history-item">
                <div className="admin-usage__history-head">
                  <strong>{h.featureCode}</strong>
                  <span className="admin-muted">
                    {new Date(h.createdAt).toLocaleString()} ·{' '}
                    {h.changedByName || h.changedByEmail || t('usage.unknownAdmin')}
                  </span>
                </div>
                <div className="admin-usage__history-diff">
                  <div>
                    <span className="admin-muted">{t('usage.before')}</span>
                    <pre>
                      {t('usage.diffLimits', {
                        freeDaily: formatLimit(h.beforeValue.freeDailyLimit, t('usage.unlimited')),
                        freeMonthly: formatLimit(
                          h.beforeValue.freeMonthlyLimit,
                          t('usage.unlimited')
                        ),
                        enforced: String(h.beforeValue.limitsEnforced ?? false),
                      })}
                    </pre>
                  </div>
                  <div>
                    <span className="admin-muted">{t('usage.after')}</span>
                    <pre>
                      {t('usage.diffLimits', {
                        freeDaily: formatLimit(h.afterValue.freeDailyLimit, t('usage.unlimited')),
                        freeMonthly: formatLimit(
                          h.afterValue.freeMonthlyLimit,
                          t('usage.unlimited')
                        ),
                        enforced: String(h.afterValue.limitsEnforced ?? false),
                      })}
                    </pre>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </AdminPageShell>
  );
}
