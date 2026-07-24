import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MachineTradeListItem } from '@machinefit/shared';
import { TradeRemainingBadge } from '@/components/trade/TradeRemainingBadge';
import { ROUTES } from '@/constants/routes';
import {
  formatTradeDate,
  formatTradeLocalized,
  formatTradePrice,
  tradeConditionKey,
  tradeStatusKey,
} from '@/utils/tradeLabels';
import '@/styles/trade.css';

interface TradeCardProps {
  trade: MachineTradeListItem;
}

export function TradeCard({ trade }: TradeCardProps) {
  const { t, i18n } = useTranslation('trade');
  const cover = trade.coverImageUrl || trade.machineImageUrl;
  const conditionKey = tradeConditionKey(trade.condition);

  return (
    <Link to={ROUTES.TRADE_DETAIL.replace(':tradeId', trade.id)} className="card trade-card">
      <div className="trade-card__cover">
        {cover ? <img src={cover} alt="" loading="lazy" decoding="async" /> : null}
      </div>
      <div className="trade-card__body">
        <div className="trade-card__brand">
          {formatTradeLocalized(trade.brandName, i18n.language)}
        </div>
        <div className="trade-card__name">
          {formatTradeLocalized(trade.machineName, i18n.language, trade.machineCode)}
        </div>
        <div className="trade-card__price">
          {formatTradePrice(trade.price, t('currency'))}
        </div>
        <div className="trade-card__meta">
          {conditionKey ? <span>{t(conditionKey)}</span> : null}
          <span>{trade.regionLabel}</span>
          <span>{formatTradeDate(trade.createdAt, i18n.language)}</span>
          <span>
            {t('views')} {trade.viewCount}
          </span>
          <span>
            {t('likes')} {trade.likeCount}
          </span>
          <span>{t(tradeStatusKey(trade.status))}</span>
        </div>
        <div className="trade-card__footer">
          <TradeRemainingBadge daysRemaining={trade.daysRemaining} isExpired={trade.isExpired} />
        </div>
      </div>
    </Link>
  );
}
