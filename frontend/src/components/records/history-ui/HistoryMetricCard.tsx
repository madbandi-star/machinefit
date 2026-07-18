import type { LucideIcon } from 'lucide-react';

export type HistoryMetricTone = 'green' | 'blue' | 'purple' | 'orange';

interface HistoryMetricCardProps {
  label: string;
  valueMain: string;
  valueUnit: string;
  tone: HistoryMetricTone;
  icon: LucideIcon;
}

export function HistoryMetricCard({
  label,
  valueMain,
  valueUnit,
  tone,
  icon: Icon,
}: HistoryMetricCardProps) {
  return (
    <article className={`history-metric-card history-metric-card--${tone}`}>
      <div className="history-metric-card__glow" aria-hidden />
      <div className="history-metric-card__top">
        <span className={`history-metric-card__icon history-metric-card__icon--${tone}`}>
          <Icon size={16} strokeWidth={2.25} aria-hidden />
        </span>
        <span className="history-metric-card__label">{label}</span>
      </div>
      <div className="history-metric-card__value-row">
        <strong className="history-metric-card__value">{valueMain}</strong>
        {valueUnit ? <span className="history-metric-card__unit">{valueUnit}</span> : null}
      </div>
      <div className={`history-metric-card__accent history-metric-card__accent--${tone}`} aria-hidden />
    </article>
  );
}

export function parseHistoryMetricValue(raw: string): { main: string; unit: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([\d,]+)(.*)$/u);
  if (!match) return { main: trimmed, unit: '' };
  return { main: match[1], unit: match[2].trim() };
}
