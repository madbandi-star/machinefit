import type { ReactNode } from 'react';
import { NumericStepper } from '@/components/form/NumericStepper/NumericStepper';
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

  const parsedAdjustedNumber =
    adjustedValue.trim() === '' ? undefined : Number.parseFloat(adjustedValue);
  const adjustStep = unit?.toLowerCase().includes('kg') ? 5 : 1;
  const adjustMax = unit?.toLowerCase().includes('kg') ? 999 : 99;

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
              {adjustedInputType === 'number' ? (
                <NumericStepper
                  value={
                    parsedAdjustedNumber != null && Number.isFinite(parsedAdjustedNumber)
                      ? parsedAdjustedNumber
                      : undefined
                  }
                  onChange={(next) =>
                    onAdjustedChange?.(next == null ? '' : String(next))
                  }
                  min={0}
                  max={adjustMax}
                  step={adjustStep}
                  unit={unit}
                  size={compact ? 'compact' : 'default'}
                  ariaLabel={`${adjustedLabel} ${label}`}
                  allowManualInput
                  showManualLink={false}
                />
              ) : (
                <input
                  className="input setting-value-card__adjust-input"
                  type="text"
                  placeholder={adjustedPlaceholder}
                  value={adjustedValue}
                  onChange={(e) => onAdjustedChange?.(e.target.value)}
                  aria-label={`${adjustedLabel} ${label}`}
                />
              )}
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
