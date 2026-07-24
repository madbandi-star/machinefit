import { useTranslation } from 'react-i18next';
import { formatTradeRemainingLabel } from '@/utils/tradeLabels';
import '@/styles/trade.css';

interface TradeRemainingBadgeProps {
  daysRemaining: number;
  isExpired: boolean;
  className?: string;
}

export function TradeRemainingBadge({
  daysRemaining,
  isExpired,
  className = '',
}: TradeRemainingBadgeProps) {
  const { t } = useTranslation('trade');
  const ended = isExpired || daysRemaining < 0;
  const today = !ended && daysRemaining === 0;
  const modifier = ended ? ' trade-remaining-badge--ended' : today ? ' trade-remaining-badge--today' : '';

  return (
    <span className={`trade-remaining-badge${modifier}${className ? ` ${className}` : ''}`}>
      {formatTradeRemainingLabel(daysRemaining, isExpired, t)}
    </span>
  );
}
