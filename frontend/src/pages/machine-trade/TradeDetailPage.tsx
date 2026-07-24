import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  TRADE_REPORT_REASONS,
  TRADE_STATUSES,
  type TradeReportReason,
  type TradeStatus,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { TradeRemainingBadge } from '@/components/trade/TradeRemainingBadge';
import { machineTradeApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import {
  formatTradeDate,
  formatTradeLocalized,
  formatTradePrice,
  tradeConditionKey,
  tradeStatusKey,
} from '@/utils/tradeLabels';
import '@/styles/components.css';
import '@/styles/trade.css';

export function TradeDetailPage() {
  const { tradeId = '' } = useParams();
  const { t, i18n } = useTranslation('trade');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<TradeReportReason>('fake');
  const [reportDesc, setReportDesc] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.machineTrade(tradeId),
    queryFn: async () => (await machineTradeApi.get(tradeId)).data.data,
    enabled: Boolean(tradeId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineTrade(tradeId) });
    queryClient.invalidateQueries({ queryKey: ['machine-trades'] });
  };

  const likeMutation = useMutation({
    mutationFn: () => machineTradeApi.toggleLike(tradeId),
    onSuccess: () => invalidate(),
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const reportMutation = useMutation({
    mutationFn: () =>
      machineTradeApi.report(tradeId, {
        reason: reportReason,
        description: reportDesc.trim() || undefined,
      }),
    onSuccess: () => {
      setReportOpen(false);
      setReportDesc('');
      showToast(t('reportSuccess'), 'success');
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: TradeStatus) => machineTradeApi.update(tradeId, { status }),
    onSuccess: () => {
      invalidate();
      showToast(t('statusUpdated'), 'success');
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const republishMutation = useMutation({
    mutationFn: () => machineTradeApi.republish(tradeId),
    onSuccess: (res) => {
      invalidate();
      showToast(t('republishSuccess'), 'success');
      navigate(ROUTES.TRADE_DETAIL.replace(':tradeId', res.data.data.id));
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => machineTradeApi.remove(tradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machine-trades'] });
      showToast(t('deleteSuccess'), 'success');
      navigate(
        data?.tradeType === 'buy' ? ROUTES.TRADE_LIST_BUY : ROUTES.TRADE_LIST_SELL
      );
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    action();
  };

  const conditionKey = tradeConditionKey(data?.condition);
  const hero = data?.images?.[0]?.imageUrl || data?.coverImageUrl || data?.machineImageUrl;

  const createdLabel = useMemo(() => {
    if (!data?.createdAt) return '';
    return formatTradeDate(data.createdAt, i18n.language);
  }, [data?.createdAt, i18n.language]);

  if (isLoading || !data) {
    return (
      <PageShell title={t('sellList')}>
        <Skeleton count={4} height={96} />
      </PageShell>
    );
  }

  return (
    <div className="trade-detail">
      <PageShell
        title={formatTradeLocalized(data.machineName, i18n.language, data.machineCode)}
        subtitle={formatTradeLocalized(data.brandName, i18n.language)}
      >
        {hero ? <img className="trade-detail__hero" src={hero} alt="" /> : null}

        {data.images.length > 1 ? (
          <div className="trade-detail__gallery">
            {data.images.map((img) => (
              <img key={img.id} src={img.thumbUrl || img.imageUrl} alt="" loading="lazy" />
            ))}
          </div>
        ) : null}

        <div className="trade-detail__meta">
          <div>
            <strong>{formatTradePrice(data.price, t('currency'))}</strong>
          </div>
          {conditionKey ? <div>{t('condition')}: {t(conditionKey)}</div> : null}
          <div>
            {t('region')}: {data.regionLabel}
          </div>
          <div>
            {t('status')}: {t(tradeStatusKey(data.status))}
          </div>
          <div>
            {t('seller')}: {data.sellerName}
          </div>
          <div>
            {t('views')} {data.viewCount} · {t('likes')} {data.likeCount} · {createdLabel}
          </div>
          <TradeRemainingBadge daysRemaining={data.daysRemaining} isExpired={data.isExpired} />
        </div>

        {data.description ? <p className="trade-detail__desc">{data.description}</p> : null}

        <div className="trade-detail__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => showToast(t('chatSoon'), 'info')}
          >
            {t('chat')}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => requireAuth(() => likeMutation.mutate())}
            disabled={likeMutation.isPending}
          >
            {data.likedByMe ? '♥' : '♡'} {data.likeCount}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => requireAuth(() => setReportOpen(true))}
          >
            {t('report')}
          </button>
        </div>

        {data.isOwner ? (
          <div className="card trade-owner-panel">
            <div className="form-row">
              <label htmlFor="trade-status">{t('status')}</label>
              <select
                id="trade-status"
                className="input"
                value={data.status}
                disabled={statusMutation.isPending}
                onChange={(e) => statusMutation.mutate(e.target.value as TradeStatus)}
              >
                {TRADE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`statuses.${status}`)}
                  </option>
                ))}
              </select>
            </div>
            {(data.isExpired || data.status === 'expired') && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => republishMutation.mutate()}
                disabled={republishMutation.isPending}
              >
                {t('republish')}
              </button>
            )}
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
            >
              {t('delete')}
            </button>
          </div>
        ) : null}

        <div style={{ marginTop: '1rem' }}>
          <Link
            to={data.tradeType === 'buy' ? ROUTES.TRADE_LIST_BUY : ROUTES.TRADE_LIST_SELL}
            className="btn btn--secondary btn--block"
          >
            {t('cancel')}
          </Link>
        </div>
      </PageShell>

      {reportOpen ? (
        <div className="dialog-overlay" role="presentation" onClick={() => setReportOpen(false)}>
          <div
            className="dialog card trade-report-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="dialog__title">{t('reportTitle')}</h3>
            <div className="form-row">
              <label htmlFor="trade-report-reason">{t('reportReason')}</label>
              <select
                id="trade-report-reason"
                className="input"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as TradeReportReason)}
              >
                {TRADE_REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {t(`reportReasons.${reason}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="trade-report-desc">{t('reportDescription')}</label>
              <textarea
                id="trade-report-desc"
                className="input"
                rows={3}
                maxLength={1000}
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
              />
            </div>
            <div className="dialog__actions">
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => reportMutation.mutate()}
                disabled={reportMutation.isPending}
              >
                {t('reportSubmit')}
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--block"
                onClick={() => setReportOpen(false)}
              >
                {t('reportCancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
