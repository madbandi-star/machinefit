import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Icon } from '@/components/icons/Icon';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { onlinePtApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import '@/styles/online-pt.css';

function payoutChipClass(status: string): string {
  if (status === 'paid') return 'opt-chip opt-chip--ok';
  if (status === 'approved') return 'opt-chip opt-chip--ok';
  if (status === 'pending') return 'opt-chip opt-chip--warn';
  if (status === 'rejected') return 'opt-chip opt-chip--danger';
  return 'opt-chip opt-chip--muted';
}

function formatMoney(n: number, locale: string): string {
  return n.toLocaleString(locale.startsWith('ko') ? 'ko-KR' : 'en-US');
}

export function OnlinePtWalletPage() {
  const { t, i18n } = useTranslation('online-pt');
  const locale = i18n.language;
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();

  const walletQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtWallet,
    queryFn: async () => (await onlinePtApi.getWallet()).data.data,
  });

  const payoutsQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtPayouts,
    queryFn: async () => (await onlinePtApi.listMyPayouts()).data.data,
  });

  const w = walletQuery.data;
  const [amount, setAmount] = useState(50000);

  useEffect(() => {
    if (!w) return;
    setAmount(
      w.availableBalance >= w.minPayoutAmount ? w.minPayoutAmount : w.availableBalance
    );
  }, [w]);

  const amountPresets = useMemo(() => {
    if (!w) return [];
    const base = [w.minPayoutAmount, 50000, 100000, 200000, w.availableBalance].filter(
      (v, i, arr) => v > 0 && v <= w.availableBalance && arr.indexOf(v) === i
    );
    return base.slice(0, 4);
  }, [w]);

  const requestMutation = useMutation({
    mutationFn: () => onlinePtApi.requestPayout(amount),
    onSuccess: () => {
      showToast(t('wallet.requestDone'), 'success');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onlinePtWallet });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onlinePtPayouts });
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('error')), 'error'),
  });

  const canRequest = Boolean(w && amount >= w.minPayoutAmount && amount <= w.availableBalance);

  return (
    <div className="opt-page">
      <PageShell>
        <header className="opt-hero opt-hero--wallet">
          <p className="opt-hero-kicker">Online PT</p>
          <h1>{t('walletTitle')}</h1>
          <p className="opt-hero-lead">{t('walletSubtitle')}</p>
          {w ? (
            <div className="opt-wallet-highlight">
              <span className="opt-wallet-highlight__label">{t('wallet.available')}</span>
              <strong className="opt-wallet-highlight__value">
                {formatMoney(w.availableBalance, locale)}
                <span className="opt-wallet-highlight__unit">{locale.startsWith('ko') ? '원' : ''}</span>
              </strong>
              <p className="opt-wallet-highlight__hint">
                {t('wallet.min', { amount: formatMoney(w.minPayoutAmount, locale) })}
              </p>
            </div>
          ) : null}
          <div className="opt-quick-actions">
            <Link to={ROUTES.ONLINE_PT_QUESTIONS} className="opt-quick-btn">
              <Icon name="history" size={16} aria-hidden />
              {t('trainerInbox')}
            </Link>
            <Link to={ROUTES.ONLINE_PT_MANAGE} className="opt-quick-btn opt-quick-btn--primary">
              <Icon name="sliders" size={16} aria-hidden />
              {t('manageTitle')}
            </Link>
          </div>
        </header>

        {walletQuery.isLoading || !w ? (
          <Skeleton count={4} />
        ) : (
          <>
            <section className="opt-stats opt-stats--wallet" aria-label={t('walletTitle')}>
              <article className="opt-stat">
                <span className="opt-stat__label">{t('wallet.month')}</span>
                <strong>{formatMoney(w.monthEarned, locale)}</strong>
              </article>
              <article className="opt-stat">
                <span className="opt-stat__label">{t('wallet.total')}</span>
                <strong>{formatMoney(w.totalEarned, locale)}</strong>
              </article>
              <article className="opt-stat">
                <span className="opt-stat__label">{t('wallet.pending')}</span>
                <strong>{formatMoney(w.pendingPayout, locale)}</strong>
              </article>
              <article className="opt-stat">
                <span className="opt-stat__label">{t('wallet.paid')}</span>
                <strong>{formatMoney(w.paidOut, locale)}</strong>
              </article>
              <article className="opt-stat">
                <span className="opt-stat__label">{t('answers', { count: w.answerCount })}</span>
                <strong>
                  ★ {w.ratingAvg.toFixed(1)} ({w.reviewCount})
                </strong>
              </article>
            </section>

            <section className="opt-panel">
              <div className="opt-panel-head">
                <div>
                  <h2>{t('wallet.request')}</h2>
                  <p className="opt-panel-desc">{t('walletRequestLead')}</p>
                </div>
              </div>

              {amountPresets.length > 0 ? (
                <div className="opt-amount-presets" role="group" aria-label={t('wallet.request')}>
                  {amountPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`opt-chip${amount === preset ? ' opt-chip--active' : ''}`}
                      onClick={() => setAmount(preset)}
                    >
                      {formatMoney(preset, locale)}
                      {locale.startsWith('ko') ? '원' : ''}
                    </button>
                  ))}
                </div>
              ) : null}

              <form
                className="opt-payout-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canRequest) requestMutation.mutate();
                }}
              >
                <label className="opt-field" htmlFor="payout-amt">
                  <span className="opt-field__label">{t('wallet.requestAmount')}</span>
                  <input
                    id="payout-amt"
                    type="number"
                    min={w.minPayoutAmount}
                    max={w.availableBalance}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  />
                </label>
                <button
                  type="submit"
                  className="opt-btn opt-btn-primary opt-btn-block"
                  disabled={requestMutation.isPending || !canRequest}
                >
                  {requestMutation.isPending ? t('wallet.requesting') : t('wallet.request')}
                </button>
                {!canRequest && w.availableBalance < w.minPayoutAmount ? (
                  <p className="opt-panel-desc">{t('wallet.insufficient')}</p>
                ) : null}
              </form>
            </section>

            <section className="opt-panel">
              <div className="opt-panel-head">
                <div>
                  <h2>{t('payoutHistory')}</h2>
                  <p className="opt-panel-desc">{t('payoutHistoryLead')}</p>
                </div>
                <span className="opt-count">{payoutsQuery.data?.length ?? 0}</span>
              </div>

              {payoutsQuery.isLoading ? (
                <Skeleton count={2} />
              ) : !payoutsQuery.data?.length ? (
                <div className="opt-empty opt-empty--compact">
                  <strong>{t('emptyPayouts')}</strong>
                  <p>{t('emptyPayoutsHint')}</p>
                </div>
              ) : (
                <div className="opt-payout-list">
                  {payoutsQuery.data.map((p) => (
                    <article key={p.id} className="opt-payout-card">
                      <div className="opt-payout-card__row">
                        <strong>{formatMoney(p.amount, locale)}{locale.startsWith('ko') ? '원' : ''}</strong>
                        <span className={payoutChipClass(p.status)}>{t(`payoutStatus.${p.status}`)}</span>
                      </div>
                      <p className="opt-payout-card__meta">
                        {new Date(p.createdAt).toLocaleString(locale.startsWith('ko') ? 'ko-KR' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </PageShell>
    </div>
  );
}
