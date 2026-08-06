import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { billingApi } from '@/api';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import './PaymentHistoryPage.css';

function formatMoney(amountCents: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale.startsWith('ko') ? 'ko-KR' : 'en-US', {
      style: 'currency',
      currency: currency || 'KRW',
      maximumFractionDigits: 0,
    }).format(amountCents);
  } catch {
    return `${amountCents} ${currency}`;
  }
}

export function PaymentHistoryPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const historyQuery = useQuery({
    queryKey: QUERY_KEYS.paymentHistory,
    queryFn: async () => (await billingApi.paymentHistory({ limit: 50 })).data.data,
    enabled: Boolean(user),
  });

  const items = historyQuery.data ?? [];

  return (
    <PageShell title={t('myPage.subscription.historyTitle')}>
      <div className="payment-history">
        <Link to={ROUTES.MY_PAGE} className="payment-history__back">
          ← {t('nav.myPage')}
        </Link>
        {historyQuery.isLoading ? (
          <p className="payment-history__empty">…</p>
        ) : items.length === 0 ? (
          <p className="payment-history__empty">{t('myPage.subscription.historyEmpty')}</p>
        ) : (
          <ul className="payment-history__list">
            {items.map((item) => (
              <li key={item.id} className="payment-history__item">
                <div className="payment-history__row">
                  <strong>
                    {formatMoney(item.amountCents, item.currency, i18n.language)}
                  </strong>
                  <span
                    className={`payment-history__badge payment-history__badge--${item.status.toLowerCase()}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="payment-history__meta">
                  <span>
                    {item.paidAt
                      ? new Date(item.paidAt).toLocaleString()
                      : new Date(item.createdAt).toLocaleString()}
                  </span>
                  <span>{item.paymentProvider}</span>
                </div>
                {item.invoiceId ? (
                  <p className="payment-history__invoice">
                    {t('myPage.subscription.invoice')}: {item.invoiceId}
                  </p>
                ) : null}
                {item.status === 'REFUNDED' ? (
                  <p className="payment-history__refund">{t('myPage.subscription.refunded')}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
