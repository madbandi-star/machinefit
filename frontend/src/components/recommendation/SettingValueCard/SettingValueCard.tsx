import type { ReactNode } from 'react';
import '@/styles/recommendation.css';

interface SettingValueCardProps {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  highlight?: boolean;
  compact?: boolean;
  labelExtra?: ReactNode;
}

export function SettingValueCard({
  label,
  value,
  unit,
  hint,
  highlight = false,
  compact = false,
  labelExtra,
}: SettingValueCardProps) {
  const className = [
    'setting-value-card',
    highlight ? 'setting-value-card--highlight' : '',
    compact ? 'setting-value-card--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <div className="setting-value-card__label-row">
        <span className="setting-value-card__label">{label}</span>
        {labelExtra}
      </div>
      <div className="setting-value-card__value-row">
        <span className="setting-value-card__value" aria-label={`${label} ${value}`}>
          {value}
        </span>
        {unit && <span className="setting-value-card__unit">{unit}</span>}
      </div>
      {hint && <span className="setting-value-card__hint">{hint}</span>}
    </div>
  );
}
