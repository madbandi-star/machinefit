import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { onlinePtApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import '@/styles/online-pt.css';

export function OnlinePtWalletPage() {
  const { t } = useTranslation('online-pt');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(50000);

  const walletQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtWallet,
    queryFn: async () => (await onlinePtApi.getWallet()).data.data,
  });

  const payoutsQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtPayouts,
    queryFn: async () => (await onlinePtApi.listMyPayouts()).data.data,
  });

  const requestMutation = useMutation({
    mutationFn: () => onlinePtApi.requestPayout(amount),
    onSuccess: () => {
      showToast(t('wallet.requestDone'), 'success');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onlinePtWallet });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onlinePtPayouts });
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('error')), 'error'),
  });

  if (walletQuery.isLoading || !walletQuery.data) {
    return (
      <PageShell title={t('walletTitle')}>
        <Skeleton count={3} />
      </PageShell>
    );
  }

  const w = walletQuery.data;

  return (
    <PageShell title={t('walletTitle')}>
      <div className="opt-stats">
        <div className="opt-stat">
          <span className="opt-meta">{t('wallet.total')}</span>
          <strong>{w.totalEarned.toLocaleString()}</strong>
        </div>
        <div className="opt-stat">
          <span className="opt-meta">{t('wallet.month')}</span>
          <strong>{w.monthEarned.toLocaleString()}</strong>
        </div>
        <div className="opt-stat">
          <span className="opt-meta">{t('wallet.pending')}</span>
          <strong>{w.pendingPayout.toLocaleString()}</strong>
        </div>
        <div className="opt-stat">
          <span className="opt-meta">{t('wallet.paid')}</span>
          <strong>{w.paidOut.toLocaleString()}</strong>
        </div>
        <div className="opt-stat">
          <span className="opt-meta">{t('wallet.available')}</span>
          <strong>{w.availableBalance.toLocaleString()}</strong>
        </div>
        <div className="opt-stat">
          <span className="opt-meta">{t('answers', { count: w.answerCount })}</span>
          <strong>
            ★ {w.ratingAvg.toFixed(1)} ({w.reviewCount})
          </strong>
        </div>
      </div>

      <p className="opt-meta">{t('wallet.min', { amount: w.minPayoutAmount.toLocaleString() })}</p>

      <form
        className="opt-form"
        onSubmit={(e) => {
          e.preventDefault();
          requestMutation.mutate();
        }}
      >
        <div>
          <label htmlFor="payout-amt">{t('wallet.request')}</label>
          <input
            id="payout-amt"
            type="number"
            min={w.minPayoutAmount}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
          />
        </div>
        <button type="submit" className="btn btn--primary" disabled={requestMutation.isPending}>
          {t('wallet.request')}
        </button>
      </form>

      <h3 style={{ marginTop: '1.25rem' }}>{t('admin.payouts')}</h3>
      <div className="opt-trainer-list">
        {(payoutsQuery.data ?? []).map((p) => (
          <div key={p.id} className="opt-trainer">
            <div className="opt-trainer__row">
              <strong>{p.amount.toLocaleString()}원</strong>
              <span>{p.status}</span>
            </div>
            <p className="opt-meta">{new Date(p.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
