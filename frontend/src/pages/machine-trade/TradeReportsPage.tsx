import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { machineTradeApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/components.css';
import '@/styles/trade.css';

export function TradeReportsPage() {
  const { t, i18n } = useTranslation('trade');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.machineTradeMyReports,
    queryFn: async () => (await machineTradeApi.myReports()).data.data,
  });

  return (
    <PageShell title={t('reports')} subtitle={t('reportsHint')}>
      {isLoading ? (
        <Skeleton count={3} height={96} />
      ) : !data?.length ? (
        <div className="card trade-empty">{t('reportsEmpty')}</div>
      ) : (
        <ul className="trade-report-list">
          {data.map((report) => {
            const rawName = report.trade?.machineName;
            const machineName =
              rawName && typeof rawName === 'object'
                ? getLocalizedName(rawName, i18n.language, '')
                : typeof rawName === 'string' && rawName
                  ? rawName
                  : report.tradeId;
            const reasonLabel = t(`reportReasons.${report.reason}`, {
              defaultValue: report.reason,
            });
            const statusLabel = t(`reportStatuses.${report.status}`, {
              defaultValue: report.status,
            });
            return (
              <li key={report.id} className="trade-report-list__item">
                <Link
                  to={ROUTES.TRADE_DETAIL.replace(':tradeId', report.tradeId)}
                  className="trade-report-list__link"
                >
                  <div className="trade-report-list__row">
                    <strong>{machineName}</strong>
                    <span className={`trade-report-list__status trade-report-list__status--${report.status}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="trade-report-list__meta">
                    {reasonLabel}
                    {report.description ? ` · ${report.description}` : ''}
                  </p>
                  <p className="trade-report-list__meta">
                    {new Date(report.createdAt).toLocaleString(i18n.language)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
