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
  showAdjustment?: boolean;
  recommendedLabel?: string;
  adjustedLabel?: string;
  adjustedValue?: string;
  adjustedPlaceholder?: string;
  adjustedInputType?: 'number' | 'text';
  onAdjustedChange?: (value: string) => void;
}

export function SettingValueCard({
  label,
  value,
  unit,
  hint,
  highlight = false,
  compact = false,
  labelExtra,
  showAdjustment = false,
  recommendedLabel,
  adjustedLabel,
  adjustedValue = '',
  adjustedPlaceholder,
  adjustedInputType = 'text',
  onAdjustedChange,
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
      <div
        className={`setting-value-card__value-row${
          showAdjustment ? ' setting-value-card__value-row--compare' : ''
        }`}
      >
        {showAdjustment ? (
          <>
            <div className="setting-value-card__compare-block">
              <span className="setting-value-card__compare-label">{recommendedLabel}</span>
              <span className="setting-value-card__value" aria-label={`${recommendedLabel} ${value}`}>
                {value}
              </span>
              {unit ? <span className="setting-value-card__unit">{unit}</span> : null}
            </div>
            <div className="setting-value-card__compare-block setting-value-card__compare-block--adjust">
              <span className="setting-value-card__compare-label">{adjustedLabel}</span>
              <input
                className="input setting-value-card__adjust-input"
                type={adjustedInputType}
                step={adjustedInputType === 'number' ? '0.5' : undefined}
                inputMode={adjustedInputType === 'number' ? 'decimal' : 'text'}
                placeholder={adjustedPlaceholder}
                value={adjustedValue}
                onChange={(e) => onAdjustedChange?.(e.target.value)}
                aria-label={`${adjustedLabel} ${label}`}
              />
              {unit ? <span className="setting-value-card__unit">{unit}</span> : null}
            </div>
          </>
        ) : (
          <>
            <span className="setting-value-card__value" aria-label={`${label} ${value}`}>
              {value}
            </span>
            {unit ? <span className="setting-value-card__unit">{unit}</span> : null}
          </>
        )}
      </div>
      {hint && <span className="setting-value-card__hint">{hint}</span>}
    </div>
  );
}
